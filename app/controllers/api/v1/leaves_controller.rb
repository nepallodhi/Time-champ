class Api::V1::LeavesController < ApplicationController
  include Authenticatable
  before_action :set_leave, only: [:show, :update, :destroy, :approve, :reject]

  def index
    user = current_user.organization.users.find(params[:user_id])
    leaves = user.leaves.order(date: :desc)
    leaves = leaves.where(status: params[:status]) if params[:status].present?
    render json: leaves
  end

  def show
    render json: @leave
  end

  def create
    user = current_user.organization.users.find(params[:user_id])
    leave = user.leaves.new(leave_params)

    if leave.save
      render json: leave, status: :created
    else
      render json: { errors: leave.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @leave.update(leave_params)
      render json: @leave
    else
      render json: { errors: @leave.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @leave.destroy
    head :no_content
  end

  def approve
    if @leave.update(status: "approved")
      render json: @leave
    else
      render json: { errors: @leave.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def reject
    if @leave.update(status: "rejected")
      render json: @leave
    else
      render json: { errors: @leave.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_leave
    @leave = current_user.organization.users.find(params[:user_id]).leaves.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Leave not found" }, status: :not_found
  end

  def leave_params
    params.require(:leave).permit(:date, :reason, :status)
  end
end
