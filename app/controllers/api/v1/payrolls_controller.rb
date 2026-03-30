class Api::V1::PayrollsController < ApplicationController
  include Authenticatable
  before_action :set_payroll, only: [:show, :update, :destroy]

  def index
    user = current_user.organization.users.find(params[:user_id])
    payrolls = user.payrolls.includes(:job_department, :salary_bonus, :leave)
                   .order(date: :desc)
    
    payrolls = payrolls.where(date: params[:date]) if params[:date].present?
    render json: payrolls
  end

  def show
    render json: @payroll
  end

  def create
    user = current_user.organization.users.find(params[:user_id])
    
    payroll = user.payrolls.new(payroll_params)
    
    # Calculate total_amount if not provided
    if payroll.total_amount.nil? || payroll.total_amount.zero?
      salary_bonus = SalaryBonus.find(payroll_params[:salary_id])
      payroll.total_amount = salary_bonus.amount + salary_bonus.bonus
    end

    if payroll.save
      render json: payroll, status: :created
    else
      render json: { errors: payroll.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @payroll.update(payroll_params)
      render json: @payroll
    else
      render json: { errors: @payroll.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @payroll.destroy
    head :no_content
  end

  private

  def set_payroll
    @payroll = current_user.organization.users.find(params[:user_id]).payrolls.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Payroll not found" }, status: :not_found
  end

  def payroll_params
    params.require(:payroll).permit(:job_id, :salary_id, :leave_id, :date, :report, :total_amount)
  end
end
