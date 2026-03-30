# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Allow requests from localhost:3000 and other systems
    # This includes localhost on any port and IP addresses on port 3000
    # Also allow ngrok URLs for deployment
    origins "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3005",
            "https://eddy-sane-senatorially.ngrok-free.dev",
            /http:\/\/localhost:\d+/,
            /http:\/\/127\.0\.0\.1:\d+/,
            /http:\/\/192\.168\.\d+\.\d+:3000/,
            /http:\/\/10\.\d+\.\d+\.\d+:3000/,
            /http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:3000/,
            /https?:\/\/[a-z0-9-]+\.ngrok-free\.dev/,
            /https?:\/\/[a-z0-9-]+\.ngrok\.io/

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
