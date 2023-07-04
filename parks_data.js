const fetch = require('node-fetch');
const fs = require('fs');

const apiKey = 'YOUR_API_KEY_HERE'; // Replace this with your API key

function queryFormatter(word) {
  if (word.includes(' ')) {
    if (word.toLowerCase().includes('national park')) {
      word = word.replace(/ /g, '%');
    } else {
      word += ' National Park';
      word = word.replace(/ /g, '%');
    }
  } else {
    word += ' National Park';
    word = word.replace(/ /g, '%');
  }
  return word;
}

function findCampgrounds(jsonData) {
  const campgrounds = [];

  const data = JSON.parse(jsonData);

  for (const facility of data) {
    if (facility.facilityType === 'campground') {
      const campground = {
        facilityName: facility.facilityName,
        facilityId: facility.facilityId
      };
      campgrounds.push(campground);
    }
  }

  return campgrounds;
}

async function getParkRecId(parkName, api) {
  // Make an API call to retrieve the rec ID for the park
  const url = `https://ridb.recreation.gov/api/v1/recareas?query=${queryFormatter(
    parkName
  )}&limit=50&offset=0&apikey=${api}`;
  const response = await fetch(url);
  const data = await response.json();
  const recreationalAreas = [];

  for (const recArea of data.RECDATA) {
    const name = recArea.RecAreaName;
    const id = recArea.RecAreaID;
    recreationalAreas.push({ name, id });
  }

  const queryCheck = queryFormatter(parkName).replace(/%/g, ' ');
  for (const x of recreationalAreas) {
    if (x.name === queryCheck) {
      return x.id;
    }
  }
}

async function getParkFacilities(parkId, api) {
  // Make an API call to retrieve the facility ID for the park
  const url = `https://ridb.recreation.gov/api/v1/recareas/${parkId}/facilities?query=campground&limit=50&offset=0&apikey=${api}`;
  const response = await fetch(url);
  const data = await response.json();

  const campgrounds = [];
  for (const facility of data.RECDATA) {
    if (facility.FacilityTypeDescription.toLowerCase() === 'campground') {
      const facilityName = facility.FacilityName;
      const facilityId = facility.FacilityID;
      campgrounds.push({ facilityName, facilityId });
    }
  }

  return campgrounds;
}

async function getFacilityActivities(facilityId, api) {
  // Make an API call to retrieve the facility ID for the park
  const url = `https://ridb.recreation.gov/api/v1/facilities/${facilityId}/activities?limit=50&offset=0&apikey=${api}`;
  const response = await fetch(url);
  const data = await response.json();

  const activities = [];
  for (const rec of data.RECDATA) {
    const activityName = rec.ActivityName;
    activities.push(activityName);
  }

  return activities;
}

async function getFacilityCampsites(facilityId, api) {
  // Make an API call to retrieve the facility ID for the park
  const url = `https://ridb.recreation.gov/api/v1/facilities/${facilityId}/campsites?limit=50&offset=0&apikey=${api}`;
  const response = await fetch(url);
  const data = await response.json();

  const campsites = [];
  for (const record of data.RECDATA) {
    const attributes = record.ATTRIBUTES;
    const campsiteAccessible = record.CampsiteAccessible;
    const campsiteId = record.CampsiteID;
    const campsiteLatitude = record.CampsiteLatitude;
    const campsiteLongitude = record.CampsiteLongitude;
    const campsiteName = record.CampsiteName;
    const campsiteReservable = record.CampsiteReservable;
    const campsiteType = record.CampsiteType;
    const createdDate = record.CreatedDate;
    const entityMedia = record.ENTITYMEDIA;
    const nestedFacilityId = record.FacilityID;
    const lastUpdatedDate = record.LastUpdatedDate;
    const loop = record.Loop;
    const permittedEquipment = record.PERMITTEDEQUIPMENT;
    const typeOfUse = record.TypeOfUse;

    const campOutput = {
      campsiteName,
      campsiteId,
      campsiteReservable,
      campsiteType,
      permittedEquipment,
      typeOfUse,
      loop,
      attributes
    };
    campsites.push(campOutput);
  }

  return campsites;
}

function campsitePrinter(facilityId, api) {
  return getFacilityCampsites(facilityId, api);
}

async function runner(park, api) {
  const parkName = queryFormatter(park).replace(/%/g, ' ');
  const parkId = await getParkRecId(park, api);

  const campgroundsOutput = await getParkFacilities(parkId, api);

  const rows = [];

  for (const campground of campgroundsOutput) {
    const facilityName = campground.facilityName;
    const facilityId = campground.facilityId;
    const activities = await getFacilityActivities(facilityId, api);
    const campsites = await campsitePrinter(facilityId, api);

    for (const campsite of campsites) {
      const row = [
        parkName,
        facilityName,
        facilityId,
        activities,
        campsite.campsiteName,
        campsite.campsiteId,
        campsite.campsiteReservable,
        campsite.campsiteType,
        campsite.permittedEquipment,
        campsite.typeOfUse,
        campsite.loop,
        campsite.attributes
      ];
      rows.push(row);
    }
  }

  // Write the data to a CSV file
  const csvContent = [
    [
      'Park Name',
      'Facility Name',
      'Facility ID',
      'Activities',
      'Campsite Name',
      'Campsite ID',
      'Campsite Reservable',
      'Campsite Type',
      'Permitted Equipment',
      'Type of Use',
      'Loop',
      'Attributes'
    ],
    ...rows
  ].map(row => row.join(',')).join('\n');

  fs.writeFileSync('national_parks.csv', csvContent);
}

// Format is either just park name (e.g., 'Yosemite') or full name (e.g., 'Yosemite National Park')
// I didn't include extensive validation logic, so I'm assuming proper input for now
runner('Yosemite', apiKey);
