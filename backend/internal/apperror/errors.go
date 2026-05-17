package apperror

import (
	"errors"
	"fmt"
	"net/http"
)

// AppError is a domain-aware HTTP error with a stable client-facing message.
type AppError struct {
	Status  int
	Code    string
	Message string
	Err     error
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func New(status int, code, message string, err error) *AppError {
	return &AppError{
		Status:  status,
		Code:    code,
		Message: message,
		Err:     err,
	}
}

func BadRequest(message string) *AppError {
	return New(http.StatusBadRequest, "bad_request", message, nil)
}

func Unauthorized(message string) *AppError {
	return New(http.StatusUnauthorized, "unauthorized", message, nil)
}

func NotFound(message string) *AppError {
	return New(http.StatusNotFound, "not_found", message, nil)
}

func Internal(err error) *AppError {
	return New(http.StatusInternalServerError, "internal_error", "internal server error", err)
}

func From(err error) *AppError {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr
	}
	return Internal(err)
}
