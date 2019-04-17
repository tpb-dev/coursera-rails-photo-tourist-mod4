require 'rails_helper'

RSpec.describe "TripImages", type: :request do
  describe "GET /trip_images" do
    it "works! (now write some real specs)" do
      get trip_images_path
      expect(response).to have_http_status(200)
    end
  end
end
