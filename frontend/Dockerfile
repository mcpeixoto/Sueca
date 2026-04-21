FROM nginx:alpine

COPY public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY config.js.template /usr/share/nginx/html/config.js.template

# Inject runtime config.js script into index.html so envsubst'd config is loaded
RUN sed -i 's|</head>|<script src="/config.js"></script></head>|' /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '${BACKEND_HOST}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && envsubst '${API_URL}' < /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js && nginx -g 'daemon off;'"]
