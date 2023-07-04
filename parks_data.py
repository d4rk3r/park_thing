import requests
import csv
import time
import json

api_key = 'YOUR_API_KEY_HERE'  # Replace this with your API key

def query_formatter(word):
    if " " in word:
        if "national park".lower() in word.lower():
            word = word.replace(" ", "%")
        else:
            word += " National Park"
            word = word.replace(" ", "%")
    else:
        word += " National Park"
        word = word.replace(" ", "%")
    return word

def find_campgrounds(json_data):
    campgrounds = []
    
    data = json.loads(json_data)
    
    for facility in data:
        if facility['facilityType'] == 'campground':
            campground = {
                'facilityName': facility['facilityName'],
                'facilityId': facility['facilityId']
            }
            campgrounds.append(campground)
    
    return campgrounds

def get_park_rec_id(park_name, api):
    # Make an API call to retrieve the rec ID for the park
    url = f'https://ridb.recreation.gov/api/v1/recareas?query={query_formatter(park_name)}&limit=50&offset=0&apikey={api}'
    response = requests.get(url)
    data = json.loads(response.text)
    recreational_areas = []
    for rec_area in data['RECDATA']:
        name = rec_area['RecAreaName']
        id = rec_area['RecAreaID']
        recreational_areas.append((name, id))
    query_check = query_formatter(park_name)
    query_check = query_check.replace("%", " ")
    for x in recreational_areas:
        if x[0] == query_check:
            return (x[1])

def get_park_facilities(park_id, api):
    # Make an API call to retrieve the facility ID for the park
    url = f'https://ridb.recreation.gov/api/v1/recareas/{park_id}/facilities?query=campground&limit=50&offset=0&apikey={api}'
    response = requests.get(url)
    data = json.loads(response.text)

    campgrounds = []
    for facility in data['RECDATA']:
        if facility['FacilityTypeDescription'].lower() == 'campground':
            activity = facility['ACTIVITY']
            campsite = facility['CAMPSITE']
            event = facility['EVENT']
            enabled = facility['Enabled']
            facility_address = facility['FACILITYADDRESS']
            facility_ada_access = facility['FacilityAdaAccess']
            facility_description = facility['FacilityDescription']
            facility_directions = facility['FacilityDirections']
            facility_email = facility['FacilityEmail']
            facility_id = facility['FacilityID']
            facility_latitude = facility['FacilityLatitude']
            facility_longitude = facility['FacilityLongitude']
            facility_map_url = facility['FacilityMapURL']
            facility_name = facility['FacilityName']
            facility_phone = facility['FacilityPhone']
            facility_reservation_url = facility['FacilityReservationURL']
            facility_type_description = facility['FacilityTypeDescription']
            facility_use_fee_description = facility['FacilityUseFeeDescription']
            geo_json = facility['GEOJSON']
            keywords = facility['Keywords']
            last_updated_date = facility['LastUpdatedDate']
            legacy_facility_id = facility['LegacyFacilityID']
            media = facility['MEDIA']
            organization = facility['ORGANIZATION']
            org_facility_id = facility['OrgFacilityID']
            permit_entrance = facility['PERMITENTRANCE']
            parent_org_id = facility['ParentOrgID']
            parent_rec_area_id = facility['ParentRecAreaID']
            rec_area = facility['RECAREA']
            reservable = facility['Reservable']
            stay_limit = facility['StayLimit']
            tour = facility['TOUR']

            campgrounds.append((facility_name, facility_id))
    return campgrounds


def get_facility_activities(facility_id, api):
    # Make an API call to retrieve the facility ID for the park
    url = f'https://ridb.recreation.gov/api/v1/facilities/{facility_id}/activities?limit=50&offset=0&apikey={api}'
    response = requests.get(url)
    data = json.loads(response.text)

    activities = []
    recdata = data['RECDATA']

    # Iterate over the recdata list
    for rec in recdata:
        activity_id = rec['ActivityID']
        activity_name = rec['ActivityName']
        facility_activity_description = rec['FacilityActivityDescription']
        facility_activity_fee_description = rec['FacilityActivityFeeDescription']
        nested_facility_id = rec['FacilityID']

        activities.append(activity_name)
    return activities


def get_facility_campsites(facility_id, api):
    # Make an API call to retrieve the facility ID for the park
    url = f'https://ridb.recreation.gov/api/v1/facilities/{facility_id}/campsites?limit=50&offset=0&apikey={api}'
    response = requests.get(url)
    data = json.loads(response.text)

    campsites = []
    recdata = data['RECDATA']

    # Iterate over the recdata list
    for record in recdata:
        attributes = record['ATTRIBUTES']
        campsite_accessible = record['CampsiteAccessible']
        campsite_id = record['CampsiteID']
        campsite_latitude = record['CampsiteLatitude']
        campsite_longitude = record['CampsiteLongitude']
        campsite_name = record['CampsiteName']
        campsite_reservable = record['CampsiteReservable']
        campsite_type = record['CampsiteType']
        created_date = record['CreatedDate']
        entity_media = record['ENTITYMEDIA']
        nested_facility_id = record['FacilityID']
        last_updated_date = record['LastUpdatedDate']
        loop = record['Loop']
        permitted_equipment = record['PERMITTEDEQUIPMENT']
        type_of_use = record['TypeOfUse']
        camp_output = (campsite_name, campsite_id, campsite_reservable, campsite_type, permitted_equipment,
                       type_of_use, loop, attributes)
        campsites.append(camp_output)
    return campsites


def campsite_printer(facility_id, api):
    campsites = []
    for x in get_facility_campsites(facility_id, api):
        campsites.append(x)
    return campsites


def runner(park, api):
    park_name = query_formatter(park).replace("%", " ")
    park_id = get_park_rec_id(park, api)
    
    campgrounds_output = get_park_facilities(park_id, api)
    
    rows = []
    
    for campground in campgrounds_output:
        facility_name = campground[0]
        facility_id = campground[1]
        activities = get_facility_activities(facility_id, api)
        campsites = campsite_printer(facility_id, api)
        
        for campsite in campsites:
            row = [park_name, facility_name, facility_id, activities, *campsite]
            rows.append(row)
    
    # Write the data to a CSV file
    with open('national_parks.csv', 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['Park Name', 'Facility Name', 'Facility ID', 'Activities', 'Campsite Name', 'Campsite ID', 'Campsite Reservable', 'Campsite Type', 'Permitted Equipment', 'Type of Use', 'Loop', 'Attributes'])
        writer.writerows(rows)


# Format is either just park name (e.g., 'Yosemite') or full name (e.g., 'Yosemite National Park')
# I didn't include extensive validation logic, so I'm assuming proper input for now
runner("Yosemite", api_key)
