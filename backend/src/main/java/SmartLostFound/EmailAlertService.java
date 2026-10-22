package SmartLostFound;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

@Service
public class EmailAlertService {

    private static final Logger log = LoggerFactory.getLogger(EmailAlertService.class);

    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";
    private static final int MAX_TEST_RECIPIENTS = 10;
    private static final Pattern EMAIL =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    private final String apiKey = System.getenv("BREVO_API_KEY");
    private final String senderEmail = System.getenv("ALERT_SENDER_EMAIL");
    private final String recipientsRaw = System.getenv("ALERT_TEST_RECIPIENTS");

    public void sendLostAlert(String itemName, String category, String location,
                              String itemDate, String description,
                              String reporterName, String reporterEmail) {

        if (isBlank(apiKey) || isBlank(senderEmail) || isBlank(recipientsRaw)) {
            log.warn("Email alert skipped: BREVO_API_KEY, ALERT_SENDER_EMAIL or "
                    + "ALERT_TEST_RECIPIENTS is not set.");
            return;
        }

        List<String> recipients = Arrays.stream(recipientsRaw.split(","))
                .map(String::trim)
                .filter(value -> EMAIL.matcher(value).matches())
                .distinct()
                .limit(MAX_TEST_RECIPIENTS)
                .toList();

        if (recipients.isEmpty()) {
            log.warn("Email alert skipped: no valid addresses in ALERT_TEST_RECIPIENTS.");
            return;
        }

        String subject = "Lost item on campus: " + plain(itemName);
        String html = buildHtml(itemName, category, location, itemDate,
                description, reporterName, reporterEmail);

        executor.submit(() -> {
            for (String to : recipients) {
                sendOne(to, subject, html);
            }
        });
    }

    private void sendOne(String to, String subject, String html) {
        try {
            String body = "{"
                    + "\"sender\":{\"name\":\"ARMIET Smart Lost & Found\",\"email\":\""
                    + json(senderEmail) + "\"},"
                    + "\"to\":[{\"email\":\"" + json(to) + "\"}],"
                    + "\"subject\":\"" + json(subject) + "\","
                    + "\"htmlContent\":\"" + json(html) + "\""
                    + "}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_URL))
                    .timeout(Duration.ofSeconds(20))
                    .header("api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response =
                    client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Lost-item alert sent to {}", to);
            } else {
                log.error("Brevo rejected email to {} (HTTP {}): {}",
                        to, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Could not send alert to {}", to, e);
        }
    }

    private String buildHtml(String itemName, String category, String location,
                             String itemDate, String description,
                             String reporterName, String reporterEmail) {
        return "<div style=\"font-family:Arial,sans-serif;max-width:560px;margin:auto\">"
                + "<h2 style=\"color:#a50021\">Lost item reported on campus</h2>"
                + "<p>If you have seen this item, please contact the owner.</p>"
                + "<table style=\"border-collapse:collapse;width:100%\">"
                + row("Item", itemName)
                + row("Category", category)
                + row("Last seen at", location)
                + row("Date", itemDate)
                + row("Description", description)
                + row("Reported by", reporterName)
                + row("Contact email", reporterEmail)
                + "</table>"
                + "<p style=\"color:#70737c;font-size:12px\">"
                + "Smart Lost and Found Management Portal - A Web-Based Platform for Item Recovery</p>"   // <-- changed line
                + "</div>";
    }

    private String row(String label, String value) {
        return "<tr><td style=\"padding:6px;border-bottom:1px solid #e5e6eb;"
                + "font-weight:bold;width:130px\">" + label + "</td>"
                + "<td style=\"padding:6px;border-bottom:1px solid #e5e6eb\">"
                + clean(value) + "</td></tr>";
    }

    private String clean(String value) {
        if (value == null || value.isBlank()) return "-";
        return value.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace("\"", "&quot;");
    }

    private String plain(String value) {
        return (value == null || value.isBlank()) ? "item" : value.trim();
    }

    private String json(String value) {
        StringBuilder out = new StringBuilder();
        for (char c : String.valueOf(value).toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (c < 0x20) out.append(String.format("\\u%04x", (int) c));
                    else out.append(c);
                }
            }
        }
        return out.toString();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    @PreDestroy
    void shutdown() {
        executor.shutdown();
    }
}