plugins {
	java
	id("org.springframework.boot") version "4.0.3"
	id("io.spring.dependency-management") version "1.1.7"
	id("com.diffplug.spotless") version "8.3.0"
}

group = "com.jhub"
version = "0.0.1-SNAPSHOT"
description = "Backend for Job Tracker app"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(25)
	}
}

spotless {
	java {
		googleJavaFormat("1.34.1")
		removeUnusedImports()
		trimTrailingWhitespace()
		endWithNewline()
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-actuator")
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-flyway")
	implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-validation")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.security:spring-security-oauth2-jose")
	implementation("org.flywaydb:flyway-database-postgresql")
	runtimeOnly("org.postgresql:postgresql")

	// lombok
	compileOnly("org.projectlombok:lombok")
	annotationProcessor("org.projectlombok:lombok")

	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.springframework.boot:spring-boot-testcontainers")
	testImplementation("org.testcontainers:testcontainers-junit-jupiter")
	testImplementation("org.testcontainers:testcontainers-postgresql")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")

	// lombok for tests
	testCompileOnly("org.projectlombok:lombok")
	testAnnotationProcessor("org.projectlombok:lombok")
}

tasks.withType<Test> {
	useJUnitPlatform()
}
