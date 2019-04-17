class TripImagesController < ApplicationController
  include ActionController::Helpers
  helper TripsHelper
  wrap_parameters :trip_image, include: ["image_id", "trip_id", "priority"]
  before_action :get_trip, only: [:index, :update, :destroy]
  before_action :get_image, only: [:image_trips]
  before_action :get_trip_image, only: [:update, :destroy]
  before_action :authenticate_user!, only: [:create, :update, :destroy]
  after_action :verify_authorized, except: [:subjects]
  #after_action :verify_policy_scoped, only: [:linkable_trips]
  before_action :origin, only: [:subjects]

  def index
    authorize @trip, :get_images?
    @trip_images = @trip.trip_images.prioritized.with_caption
  end

  def image_trips
    authorize @image, :get_trips?
    @trip_images=@image.trip_images.prioritized.with_name
    render :index
  end

  def linkable_trips
    authorize Trip, :get_linkables?
    image = Image.find(params[:image_id])
    #@trips=policy_scope(Trip.not_linked(image))
    #need to exclude admins from seeing trips they cannot link
    @trips=Trip.not_linked(image)
    @trips=TripPolicy::Scope.new(current_user,@trips).user_roles(true,false)
    @trips=TripPolicy.merge(@trips)
    render "trips/index"
  end

  def subjects
    expires_in 1.minute, :public=>true
    miles=params[:miles] ? params[:miles].to_f : nil
    subject=params[:subject]
    distance=params[:distance] ||= "false"
    reverse=params[:order] && params[:order].downcase=="desc"  #default to ASC
    last_modified=TripImage.last_modified
    state="#{request.headers['QUERY_STRING']}:#{last_modified}"
    #use eTag versus last_modified -- ng-token-auth munges if-modified-since
    eTag="#{Digest::MD5.hexdigest(state)}"

    if stale?  :etag=>eTag
      @trip_images=TripImage.within_range(@origin, miles, reverse)
                        .with_name
                        .with_caption
                        .with_position
      @trip_images=@trip_images.trips    if subject && subject.downcase=="trip"
      @trip_images=TripImage.with_distance(@origin, @trip_images) if distance.downcase=="true"
      render "trip_images/index"
    end
  end

  def create
    trip_image = TripImage.new(trip_image_create_params.merge({
                                                                     :image_id=>params[:image_id],
                                                                     :trip_id=>params[:trip_id],
                                                                 }))
    trip=Trip.where(id:trip_image.trip_id).first
    if !trip
      full_message_error "cannot find trip[#{params[:trip_id]}]", :bad_request
      skip_authorization
    elsif !Image.where(id:trip_image.image_id).exists?
      full_message_error "cannot find image[#{params[:image_id]}]", :bad_request
      skip_authorization
    else
      authorize trip, :add_image?
      trip_image.creator_id=current_user.id
      if trip_image.save
        head :no_content
      else
        render json: {errors:@trip_image.errors.messages}, status: :unprocessable_entity
      end
    end
  end

  def update
    authorize @trip, :update_image?
    if @trip_image.update(trip_image_update_params)
      head :no_content
    else
      render json: {errors:@trip_image.errors.messages}, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @trip, :remove_image?
    @trip_image.image.touch #image will be only trip left
    @trip_image.destroy
    head :no_content
  end

  private
  def get_trip
    @trip ||= Trip.find(params[:trip_id])
  end
  def get_image
    @image ||= Image.find(params[:image_id])
  end
  def get_trip_image
    @trip_image ||= TripImage.find(params[:id])
  end

  def trip_image_create_params
    params.require(:trip_image).tap {|p|
      #_ids only required in payload when not part of URI
      p.require(:image_id)    if !params[:image_id]
      p.require(:trip_id)    if !params[:trip_id]
    }.permit(:priority, :image_id, :trip_id)
  end
  def trip_image_update_params
    params.require(:trip_image).permit(:priority)
  end

  def origin
    case
    when params[:lng] && params[:lat]
      @origin=Point.new(params[:lng].to_f, params[:lat].to_f)
    else
      raise ActionController::ParameterMissing.new(
          "an origin [lng/lat] required")
    end
  end
end
