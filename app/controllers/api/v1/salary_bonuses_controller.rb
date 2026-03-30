class Api::V1::SalaryBonusesController < ApplicationController
  include Authenticatable
  before_action :set_salary_bonus, only: [:show, :update, :destroy]

  def index
    job_department = current_user.organization.job_departments.find(params[:job_department_id])
    salary_bonuses = job_department.salary_bonuses
    render json: salary_bonuses
  end

  def show
    render json: @salary_bonus
  end

  def create
    job_department = current_user.organization.job_departments.find(params[:job_department_id])
    salary_bonus = job_department.salary_bonuses.new(salary_bonus_params)

    if salary_bonus.save
      render json: salary_bonus, status: :created
    else
      render json: { errors: salary_bonus.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @salary_bonus.update(salary_bonus_params)
      render json: @salary_bonus
    else
      render json: { errors: @salary_bonus.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @salary_bonus.destroy
    head :no_content
  end

  private

  def set_salary_bonus
    job_department = current_user.organization.job_departments.find(params[:job_department_id])
    @salary_bonus = job_department.salary_bonuses.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Salary bonus not found" }, status: :not_found
  end

  def salary_bonus_params
    params.require(:salary_bonus).permit(:amount, :annual, :bonus)
  end
end
