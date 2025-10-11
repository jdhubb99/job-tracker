package com.jhub.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.context.ImportTestcontainers;

import com.jhub.backend.config.TestContainersConfig;

@SpringBootTest
@ImportTestcontainers(TestContainersConfig.class)
class JobtrackerBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
