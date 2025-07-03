{
    "version": 2,
    "builds": [
        {
            "src": "backend/server.js",
            "use": "@vercel/node"
        },
        {
            "src": "frontend/package.json",
            "use": "@vercel/static-build"
        }
    ],
    "rewrites": [
        {
            "source": "/socket.io/(.*)",
            "destination": "/backend/server.js"
        },
        {
            "source": "/(.*)",
            "destination": "/frontend/index.html"
        }
    ]
}