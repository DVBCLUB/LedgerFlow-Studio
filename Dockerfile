# Sử dụng Node.js LTS làm base image
FROM node:20-alpine AS builder

# Đặt thư mục làm việc
WORKDIR /app

# Sao chép package files và cài đặt toàn bộ dependencies bao gồm cả devDependencies để build
COPY package*.json ./
RUN npm ci

# Sao chép mã nguồn của dự án
COPY . .

# Build ứng dụng (sinh ra thư mục dist chứa SPA static files và file server.cjs)
RUN npm run build:docker

# Stage 2: Môi trường chạy thực tế tối giản (Production Stage)
FROM node:20-alpine

WORKDIR /app

# Khai báo môi trường production nhằm tối ưu hiệu năng của Express
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
# Chỉ cài đặt dependencies cần thiết cho runtime (loại bỏ devDependencies nặng)
RUN npm ci --only=production

# Sao chép thư mục build từ builder stage
COPY --from=builder /app/dist ./dist

# Mở cổng 3000 phục vụ lưu lượng
EXPOSE 3000

# Khởi chạy Express Server đã được esbuild đóng gói sang CJS
CMD ["node", "dist/server.cjs"]
