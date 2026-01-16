# Docker Deployment Guide

This guide covers how to deploy Rustic Twingo Encoder using Docker.

## Quick Start

### Production Deployment

1. **Adjust paths in docker-compose.yml** (if needed):
   ```yaml
   volumes:
     - /home/yodak025/Music:/music:ro           # Your music source
     - /home/yodak025/Music/outputs:/outputs:rw # Output directory
   ```

2. **Build and run**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   Open http://localhost:3000 (or http://YOUR_SERVER_IP:3000 from network)

4. **View logs**:
   ```bash
   docker-compose logs -f rustic-twingo-encoder
   ```

5. **Stop the container**:
   ```bash
   docker-compose down
   ```

### Development Mode (with hot-reload)

1. **Start development environment**:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. **Code changes will automatically reload** - no rebuild needed

## Configuration

### Volume Mappings

The application requires two volume mounts:

- **Source Music** (`/music`): Mount as read-only (`:ro`) - your audio library
- **Output Directory** (`/outputs`): Mount as read-write (`:rw`) - where encoded files are saved

### Config File

The Docker setup uses `config/config.docker.json` which uses container paths:
- `rootDirectory`: `/music` (mapped to your host music directory)
- `outputRootDirectory`: `/outputs` (mapped to your host output directory)

**Do not modify** these paths in `config.docker.json` - they are relative to the container. Instead, change the volume mappings in `docker-compose.yml`.

### File Permissions

The container runs as UID:GID `1000:1000` to match typical Linux user permissions. If your user has different UID/GID, update the `user:` field in `docker-compose.yml`:

```bash
# Check your UID/GID
id -u  # Returns your UID
id -g  # Returns your GID

# Then update docker-compose.yml
user: "YOUR_UID:YOUR_GID"
```

## Resource Management

Default limits in `docker-compose.yml`:
- **CPU**: 2 cores max, 0.5 cores reserved
- **Memory**: 2GB max, 512MB reserved

Adjust based on your server capacity and encoding workload.

## Network Access

### Local Network Access

The application is accessible on port 3000. To access from other devices on your network:

1. Find your server's IP address:
   ```bash
   ip addr show | grep inet
   ```

2. Access from any device on your network:
   ```
   http://YOUR_SERVER_IP:3000
   ```

### Change Port

To use a different port, edit `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Access via port 8080
```

## Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### View Logs

```bash
# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100
```

### Clean Up

```bash
# Remove container and volumes
docker-compose down -v

# Remove images
docker rmi rustic-twingo-encoder:latest
```

## Troubleshooting

### Permission Issues

If encoded files have wrong permissions:
1. Verify your UID/GID with `id -u` and `id -g`
2. Update `user:` in `docker-compose.yml`
3. Restart: `docker-compose restart`

### ffmpeg Not Found

The Dockerfile includes ffmpeg installation. If you see ffmpeg errors:
```bash
# Check ffmpeg is installed in container
docker exec rustic-twingo-encoder ffmpeg -version
```

### Container Won't Start

Check logs for errors:
```bash
docker-compose logs rustic-twingo-encoder
```

### Port Already in Use

If port 3000 is taken, change it in `docker-compose.yml` ports section.

## Manual Docker Commands

If you prefer not to use docker-compose:

### Build
```bash
docker build -t rustic-twingo-encoder:latest .
```

### Run
```bash
docker run -d \
  --name rustic-twingo-encoder \
  -p 3000:3000 \
  -v /home/yodak025/Music:/music:ro \
  -v /home/yodak025/Music/outputs:/outputs:rw \
  -v $(pwd)/config/config.docker.json:/app/config/config.json:ro \
  -u 1000:1000 \
  rustic-twingo-encoder:latest
```

### Stop
```bash
docker stop rustic-twingo-encoder
docker rm rustic-twingo-encoder
```
