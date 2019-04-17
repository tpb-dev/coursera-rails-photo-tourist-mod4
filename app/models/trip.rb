class Trip < ActiveRecord::Base
  include Protectable
  validates :name, :presence=>true

  has_many :trip_images, inverse_of: :trip, dependent: :destroy

  scope :not_linked, ->(image) { where.not(:id=>TripImage.select(:trip_id)
                                                    .where(:image=>image)) }
end
