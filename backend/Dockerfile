FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 8080

# JVM flags optimized for free-tier containers (limited memory ~512MB)
ENTRYPOINT ["java", \
  "-Xmx384m", \
  "-Xms128m", \
  "-XX:+UseSerialGC", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Dserver.port=${PORT:-8080}", \
  "-jar", "app.jar"]
