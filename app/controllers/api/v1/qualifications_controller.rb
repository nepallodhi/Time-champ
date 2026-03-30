class Api::V1::QualificationsController < ApplicationController
  include Authenticatable
  before_action :set_qualification, only: [:show, :update, :destroy]

  def index
    user = current_user.organization.users.find(params[:user_id])
    qualifications = user.qualifications
    render json: qualifications
  end

  def show
    render json: @qualification
  end

  def create
    user = current_user.organization.users.find(params[:user_id])
    qualification = user.qualifications.new(qualification_params)

    if qualification.save
      render json: qualification, status: :created
    else
      render json: { errors: qualification.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @qualification.update(qualification_params)
      render json: @qualification
    else
      render json: { errors: @qualification.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @qualification.destroy
    head :no_content
  end

  private

  def set_qualification
    @qualification = current_user.organization.users.find(params[:user_id]).qualifications.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Qualification not found" }, status: :not_found
  end

  def qualification_params
    params.require(:qualification).permit(:job_id, :position, :requirements, :date_in)
  end
end
