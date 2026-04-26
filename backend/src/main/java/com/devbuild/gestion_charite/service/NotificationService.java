package com.devbuild.gestion_charite.service;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

	private final ObjectProvider<JavaMailSender> mailSenderProvider;

	@Value("${app.notifications.email.enabled:false}")
	private boolean emailEnabled;

	@Value("${app.notifications.from:no-reply@gestion-charite.local}")
	private String fromEmail;

	public NotificationService(ObjectProvider<JavaMailSender> mailSenderProvider) {
		this.mailSenderProvider = mailSenderProvider;
	}

	public Map<String, Object> sendActionUpdate(String toEmail, String subject, String body) {
		String finalSubject = (subject == null || subject.isBlank())
				? "Mise a jour action caritative"
				: subject;
		String finalBody = (body == null || body.isBlank())
				? "Une action caritative que vous suivez a ete mise a jour."
				: body;

		if (!emailEnabled) {
			return Map.of(
					"status", "mock_queued",
					"toEmail", toEmail,
					"subject", finalSubject,
					"sentAt", LocalDateTime.now().toString(),
					"reason", "Email disabled by configuration"
			);
		}

		JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
		if (mailSender == null) {
			return Map.of(
					"status", "mock_queued",
					"toEmail", toEmail,
					"subject", finalSubject,
					"sentAt", LocalDateTime.now().toString(),
					"reason", "JavaMailSender is not available"
			);
		}

		try {
			SimpleMailMessage message = new SimpleMailMessage();
			message.setFrom(fromEmail);
			message.setTo(toEmail);
			message.setSubject(finalSubject);
			message.setText(finalBody);
			mailSender.send(message);

			return Map.of(
					"status", "sent",
					"toEmail", toEmail,
					"subject", finalSubject,
					"sentAt", LocalDateTime.now().toString()
			);
		} catch (Exception ex) {
			return Map.of(
					"status", "failed",
					"toEmail", toEmail,
					"subject", finalSubject,
					"sentAt", LocalDateTime.now().toString(),
					"error", ex.getMessage()
			);
		}
	}
}
