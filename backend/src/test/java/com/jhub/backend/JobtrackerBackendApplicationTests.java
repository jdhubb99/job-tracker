package com.jhub.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.context.ImportTestcontainers;
import org.springframework.test.context.ActiveProfiles;

import com.jhub.backend.config.TestContainersConfig;

@SpringBootTest
@ImportTestcontainers(TestContainersConfig.class)
@ActiveProfiles("test")
class JobtrackerBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
