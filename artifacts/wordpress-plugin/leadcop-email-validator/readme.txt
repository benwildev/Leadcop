===LeadCop Email Validator===
Contributors: leadcop
Tags: email validation, disposable email, spam prevention, newsletter, WooCommerce
Requires at least: 5.8
Tested up to: 6.5
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Validate email addresses on WordPress forms using the LeadCop API. Block disposable, role-based, and undeliverable addresses instantly.

== Description ==

LeadCop Email Validator connects your WordPress site to the LeadCop API to validate email addresses in real time — before they ever reach your database.

**Key Features**

* **Blocks disposable emails** — Reject single-use and throwaway email providers (Mailinator, Guerrilla Mail, etc.)
* **Blocks role-based emails** — Optionally reject addresses like info@, admin@, noreply@
* **MX record check** — Verify the domain actually has a working mail server
* **SMTP validation** — Optionally check whether the specific mailbox exists (uses extra API credits)
* **WordPress registration** — Validate emails on the default WP user registration form
* **WordPress comments** — Optionally validate commenter email addresses
* **WooCommerce** — Validate billing email on checkout and the WooCommerce registration form
* **Contact Form 7** — Validate all email fields in CF7 forms automatically
* **Newsletter subscribe shortcode** — Add `[leadcop_subscribe]` to any page or post
* **Newsletter widget** — Drag-and-drop subscribe form for any widget area
* **Customisable error message** — Set the exact text shown to users when an email is rejected

**All validation is done server-side** — your API key is never exposed to the browser.

**Getting Started**

1. Sign up at [leadcop.io](https://leadcop.io) and copy your API key from the dashboard.
2. Go to **Settings → LeadCop** in your WordPress admin and paste your API key.
3. Choose which forms and rules to enable. Save.

**Newsletter Shortcode**

Place `[leadcop_subscribe]` in any page, post, or widget:

    [leadcop_subscribe]

Optional attributes:

* `show_name="yes"` — adds a name field above the email input
* `button_text="Join now"` — customise the button label
* `placeholder="Enter your email"` — customise the input placeholder
* `success_msg="You're in!"` — message shown after a successful subscription

Example:

    [leadcop_subscribe show_name="yes" button_text="Get updates" success_msg="Welcome aboard!"]

== Installation ==

1. Upload the `leadcop-email-validator` folder to the `/wp-content/plugins/` directory, or install through **Plugins → Add New** by uploading the zip file.
2. Activate the plugin through the **Plugins** menu in WordPress.
3. Go to **Settings → LeadCop** and enter your API key.

== Frequently Asked Questions ==

= Do I need a LeadCop account? =

Yes. Sign up at [leadcop.io](https://leadcop.io) — a free tier is available.

= Will this slow down my forms? =

Each validation call adds a small network round-trip (typically under 500 ms). SMTP validation takes longer and is disabled by default.

= What happens if the LeadCop API is unreachable? =

The plugin fails open — if the API returns an error or times out, the form submission is allowed through. Your site never breaks because of a third-party API issue.

= Can I use this with other form plugins? =

Currently Contact Form 7 is supported natively. For other plugins (Gravity Forms, WPForms, etc.) you can use the `leadcop_validate_email()` PHP function directly in custom code.

= Is the API key stored securely? =

Yes. The API key is stored in the WordPress options table and is only used in server-side PHP requests. It is never sent to the browser.

== Screenshots ==

1. Settings page — API connection and validation rules
2. Subscribe shortcode rendered on a page
3. WooCommerce checkout validation in action

== Changelog ==

= 1.0.0 =
* Initial release.
* Email validation on WP registration, comments, WooCommerce, Contact Form 7.
* Newsletter subscribe shortcode `[leadcop_subscribe]` and widget.
* Configurable validation rules and error message.
