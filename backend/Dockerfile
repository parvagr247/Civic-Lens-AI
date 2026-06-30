# Stage 1: Build the JAR package
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimalist JRE Runtime Image
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S civiclens && adduser -S civiclens -G civiclens

WORKDIR /app
COPY --from=build /app/target/civiclens-0.0.1-SNAPSHOT.jar app.jar

# Setup logging mount point
RUN mkdir -p /opt/civiclens/logs && \
    chown -R civiclens:civiclens /app /opt/civiclens

USER civiclens
EXPOSE 9526

# Perform Actuator-grounded Docker health check every 30 seconds
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:9526/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
