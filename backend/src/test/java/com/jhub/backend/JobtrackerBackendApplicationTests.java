package com.jhub.backend;

import com.jhub.backend.config.TestContainersConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.context.ImportTestcontainers;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ImportTestcontainers(TestContainersConfig.class)
@ActiveProfiles("test")
class JobtrackerBackendApplicationTests {

  @Test
  void contextLoads() {}
}
