class Api::V1::JobDepartmentsController < ApplicationController
  include Authenticatable
  before_action :set_job_department, only: [:show, :update, :destroy]

  def index
    job_departments = current_user.organization.job_departments
    render json: job_departments
  end

  def show
    render json: @job_department
  end

  def create
    job_department = current_user.organization.job_departments.new(job_department_params)

    if job_department.save
      render json: job_department, status: :created
    else
      render json: { errors: job_department.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @job_department.update(job_department_params)
      render json: @job_department
    else
      render json: { errors: @job_department.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @job_department.destroy
    head :no_content
  end

  private

  def set_job_department
    @job_department = current_user.organization.job_departments.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Job department not found" }, status: :not_found
  end

  def job_department_params
    params.require(:job_department).permit(:job_dept, :name, :description, :salary_range)
  end
end
