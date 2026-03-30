Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check
  get "health" => "rails/health#show" # Custom health endpoint as requested

  # Mount ActionCable for WebSocket connections
  mount ActionCable.server => "/cable"

  namespace :api do
    namespace :v1 do
      post "auth/register", to: "auth#register"
      post "auth/login", to: "auth#login"
      post "auth/refresh", to: "auth#refresh"

      get "health", to: "health#show"
      get "dashboard/statistics", to: "dashboard#statistics"

      resources :sessions, only: [] do
        collection do
          post :start
          get :active
          get :index
        end
        member do
          post :stop
          post :activity, to: "activities#create"
          get :batch_activity, to: "batch_activities#show"
          post :batch_activity, to: "batch_activities#create"
          resources :screenshots, only: [ :create ], controller: "screenshots"
        end
      end

      resources :screenshots, only: [ :index, :show ] do
        member do
          get :image
        end
      end

      resources :attendance, only: [ :index, :show ] do
        collection do
          post :update_activity
        end
      end

      resources :projects do
        member do
          post :assign_user
          delete :unassign_user
        end
        collection do
          get :available_employees
        end
      end

      resources :managers, only: [ :index ] do
        member do
          post :add_employee, to: "managers#add_employee"
          delete "employees/:employee_id", to: "managers#remove_employee", as: :remove_employee
        end
      end

      resources :alerts, only: [ :index, :show ] do
        member do
          post :resolve
        end
      end

      resources :users, only: [ :index, :show, :create, :update, :destroy ] do
        member do
          get :activity_minutes
          get :screenshots
          get :batch_activity
        end
        resources :qualifications, only: [ :index, :show, :create, :update, :destroy ]
        resources :leaves, only: [ :index, :show, :create, :update, :destroy ] do
          member do
            post :approve
            post :reject
          end
        end
        resources :payrolls, only: [ :index, :show, :create, :update, :destroy ]
      end

      resources :job_departments do
        resources :salary_bonuses, only: [ :index, :show, :create, :update, :destroy ]
      end

      namespace :reports do
        get :daily, to: "daily#daily"
        get "user/:id", to: "user#show"
      end
    end
  end

  # Defines the root path route ("/")
  # root "posts#index"
end
