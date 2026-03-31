package com.devbuild.gestion_charite.controller;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

	@PostMapping("/action-update")
	public ResponseEntity<?> notifyActionUpdate(@RequestBody NotificationRequest request) {
		if (request.toEmail() == null || request.toEmail().isBlank()) {
			return ResponseEntity.badRequest().body(Map.of("error", "toEmail est obligatoire"));
		}

		return ResponseEntity.ok(Map.of(
				"status", "queued",
				"toEmail", request.toEmail(),
				"subject", request.subject() == null ? "Mise a jour action caritative" : request.subject(),
				"sentAt", LocalDateTime.now().toString()
		));
	}

	public record NotificationRequest(String toEmail, String subject, String body) {
	}
}
