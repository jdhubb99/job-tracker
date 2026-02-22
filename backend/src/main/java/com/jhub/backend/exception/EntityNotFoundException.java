package com.jhub.backend.exception;

public class EntityNotFoundException extends RuntimeException {

  public EntityNotFoundException(String entityName, String fieldName, Object fieldValue) {
    super(String.format("%s not found with %s: '%s'", entityName, fieldName, fieldValue));
  }
}
