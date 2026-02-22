package com.jhub.backend.exception;

public class EmailAlreadyExistsException extends RuntimeException {

  public EmailAlreadyExistsException() {
    super("Email already registered");
  }
}
