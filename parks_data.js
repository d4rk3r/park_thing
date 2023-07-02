const fetch = require('node-fetch');

const api_key = 'YOUR_API_KEY_HERE'; // Replace this with your API key

function query_formatter(word) {
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

function find_campgrounds(json_data) {
  const campgrounds = [];
  const data = JSON.parse(json_data);
  for (const facility of data) {
    if (facility.facilityType === 'campground') {
      const campground = {
        facilityName: facility.facilityName,
        facilityId: facility.facilityId,
      };
      campgrounds.push(campground);
    }
  }
  return campgrounds;
}

async function get_park_rec_id(park_name, api) {
  // Make an API call to retrieve the rec ID for the park
  const url = `https://ridb.recreation.gov/api/v1/recareas?query=${query_formatter(
    park_name
  )}&limit=50&offset=0&apikey=${api}`;
  const response = await fetch(url);
  const data = await response.json();
  const recreational_areas = [];
  for (const rec_area of data.RECDATA) {
    const name = rec_area.RecAreaName;
    const id = rec_area.RecAreaID;
    recreational_areas.push({ name, id });
  }
  const query_check = query_formatter(park_name).replace(/%/g, ' ');
  for (const x of recreational_areas) {
    if (x.name === query_check) {
      return x.id;
    }
  }
}

async function get_park_facilities(park_id, api) {
  // Make an API call to retrieve the facility ID for the park
  const url = `https://ridb.recreation.gov/api/v1/recareas/${park_id}/facilities?query=campground&limit=50&offset=0&apikey=${api}`;
  const response = await fetch(url);
  const data = await response.json();

  const campgrounds = [];
  for (const facility of data.RECDATA) {
    if (facility.FacilityTypeDescription.toLowerCase() === 'campground') {
      const {
        ACTIVITY,
        CAMPSITE,
        EVENT,
        Enabled,
        FACILITYADDRESS,
        FacilityAdaAccess,
        FacilityDescription,
        FacilityDirections,
        FacilityEmail,
        FacilityID,
        FacilityLatitude,
        FacilityLongitude,
        FacilityMapURL,
        FacilityName,
        FacilityPhone,
        FacilityReservationURL,
        FacilityTypeDescription,
        FacilityUseFeeDescription,
        GEOJSON,
        Keywords,
        LastUpdatedDate,
        LegacyFacilityID,
        MEDIA,
        ORGANIZATION,
        OrgFacilityID,
        PERMITENTRANCE,
        ParentOrgID,
        ParentRecAreaID,
        RECAREA,
        Reservable,
        StayLimit,
        TOUR,
      } = facility;

      campgrounds.push({
        facilityName: FacilityName,
        facilityId: FacilityID,
        activity: ACTIVITY,
        campsite: CAMPSITE,
        event: EVENT,
        enabled: Enabled,
        facilityAddress: FACILITYADDRESS,
        facilityAdaAccess: FacilityAdaAccess,
        facilityDescription: FacilityDescription,
        facilityDirections: FacilityDirections,
        facilityEmail: FacilityEmail,
        facilityLatitude: FacilityLatitude,
        facilityLongitude: FacilityLongitude,
        facilityMapUrl: FacilityMapURL,
        facilityPhone: FacilityPhone,
        facilityReservationUrl: FacilityReservationURL,
        facilityTypeDescription: FacilityTypeDescription,
        facilityUseFeeDescription: FacilityUseFeeDescription,
        geoJson: GEOJSON,
        keywords: Keywords,
        lastUpdatedDate: LastUpdatedDate,
        legacyFacilityId: LegacyFacilityID,
        media: MEDIA,
        organization: ORGANIZATION,
        orgFacilityId: OrgFacilityID,
        permitEntrance: PERMITENTRANCE,
        parentOrgId: ParentOrgID,
        parentRecAreaId: ParentRecAreaID,
        recArea: RECAREA,
        reservable: Reservable,
        stayLimit: StayLimit,
        tour: TOUR,
      });
    }
  }
  return campgrounds;
}

async function get_facility_activities(facility_id, api) {
  // Make an API call to retrieve the facility ID for the park
  const url = `https://ridb.recreation.gov/api/v1/facilities/${facility_id}/activities?limit=50&offset=0&apikey=${api}`;
  const response = await fetch(url);
  const data = await response.json();

  const activities = [];
  const recdata = data.RECDATA;
  for (const rec of recdata) {
    const {
      ActivityID,
      ActivityName,
      FacilityActivityDescription,
      FacilityActivityFeeDescription,
      FacilityID: nestedFacilityId,
    } = rec;
    activities.push({
      activityId: ActivityID,
      activityName: ActivityName,
      facilityActivityDescription: FacilityActivityDescription,
      facilityActivityFeeDescription: FacilityActivityFeeDescription,
      nestedFacilityId,
    });
  }
  return activities;
}

async function get_facility_campsites(facility_id, api) {
  // Make an API call to retrieve the facility ID for the park
  const url = `https://ridb.recreation.gov/api/v1/facilities/${facility_id}/campsites?limit=50&offset=0&apikey=${api}`;
  const response = await fetch(url);
  const data = await response.json();

  const campsites = [];
  const recdata = data.RECDATA;
  for (const record of recdata) {
    const {
      ATTRIBUTES,
      CampsiteAccessible: campsiteAccessible,
      CampsiteID: campsiteId,
      CampsiteLatitude: campsiteLatitude,
      CampsiteLongitude: campsiteLongitude,
      CampsiteName: campsiteName,
      CampsiteReservable: campsiteReservable,
      CampsiteType: campsiteType,
      CreatedDate: createdDate,
      ENTITYMEDIA: entityMedia,
      FacilityID: nestedFacilityId,
      LastUpdatedDate: lastUpdatedDate,
      Loop: loop,
      PERMITTEDEQUIPMENT: permittedEquipment,
      TypeOfUse: typeOfUse,
    } = record;
    const campOutput = {
      campsiteName,
      campsiteId,
      campsiteReservable,
      campsiteType,
      permittedEquipment,
      typeOfUse,
      loop,
      attributes: ATTRIBUTES,
    };
    campsites.push(campOutput);
  }
  return campsites;
}

function campsite_printer(facility_id, api) {
  get_facility_campsites(facility_id, api).then((campsites) => {
    for (const x of campsites) {
      for (const key in x) {
        console.log(key);
        console.log(x[key]);
        console.log('--');
      }
      console.log('-------');
    }
  });
}

async function runner(park, api) {
  console.log('*************');
  console.log(query_formatter(park).replace(/%/g, ' '));
  console.log(await get_park_rec_id(park, api));
  console.log('*************');
  const campgroundsOutput = await get_park_facilities(await get_park_rec_id(park, api), api);
  for (const x of campgroundsOutput) {
    console.log(x);
    console.log(await get_facility_activities(x.facilityId, api));
    console.log('--');
    campsite_printer(x.facilityId, api);
  }
}

// Format is either just park name (e.g., 'Yosemite') or full name (e.g., 'Yosemite National Park')
// I didn't include extensive validation logic, so I'm assuming proper input for now
runner('Yosemite', api_key);
