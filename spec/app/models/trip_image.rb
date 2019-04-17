class TripImage < ActiveRecord::Base
  belongs_to :image
  belongs_to :trip
  acts_as_mappable :through => :image

  validates :image, :trip, presence: true

  scope :prioritized,-> { order(:priority=>:asc) }
  scope :trips,     -> { where(:priority=>0) }
  scope :primary,    -> { where(:priority=>0).first }

  scope :with_trip, ->{ joins("left outer join trips on trips.id = trip_images.trip_id")
                             .select("trip_images.*")}
  scope :with_image, ->{ joins("right outer join images on images.id = trip_images.image_id")
                             .select("trip_images.*","images.id as image_id")}

  scope :with_name,    ->{ with_trip.select("trips.name as trip_name")}
  scope :with_caption, ->{ with_image.select("images.caption as image_caption")}
  scope :with_position,->{ with_image.select("images.lng, images.lat")}
  scope :within_range, ->(origin, limit=nil, reverse=nil) {
    scope=with_position
    scope=scope.within(limit,:origin=>origin)                   if limit
    scope=scope.by_distance(:origin=>origin, :reverse=>reverse) unless reverse.nil?
    return scope
  }

  def self.with_distance(origin, scope)
    scope.select("-1.0 as distance").with_position
        .each {|ti| ti.distance = ti.distance_from(origin) }
  end

  def self.last_modified
=begin
    m1=Trip.maximum(:updated_at)
    m2=Image.maximum(:updated_at)
    m3=TripImage.maximum(:updated_at)
    [m1,m2,m3].max
=end
    unions=[Trip,Image,TripImage].map {|t|
      "select max(updated_at) as modified from #{t.table_name}\n"
    }.join(" union\n")
    sql   ="select max(modified) as last_modified from (\n#{unions}) as x"
    value=connection.select_value(sql)
    Time.parse(value + "UTC") if value
  end
end
