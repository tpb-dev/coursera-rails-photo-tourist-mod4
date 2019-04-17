json.extract! trip, :id, :name, :description, :created_at, :updated_at
json.notes trip.notes   unless restrict_notes? trip.user_roles
json.url trip_url(trip, format: :json)
json.user_roles trip.user_roles    unless trip.user_roles.empty?
