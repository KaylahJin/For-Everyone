# Use Java 17 base image
FROM eclipse-temurin:17-jre-alpine

# Set working directory inside container
WORKDIR /app

# Copy built JAR from target/
COPY target/*.jar app.jar

# Expose app port
EXPOSE 8080

# Run the Spring Boot JAR
ENTRYPOINT ["java", "-jar", "app.jar"]
