=== LeadCop Email Validator ===
Contributors: leadcop
Tags: email validation, disposable email, spam, woocommerce, contact form 7
Requires at least: 5.6
Tested up to: 6.5
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Block disposable and unwanted email addresses from your WordPress forms using the LeadCop API.

== Description ==

**LeadCop Email Validator** protects your WordPress site by rejecting disposable (burner) email addresses, free email providers, and addresses with invalid MX records — in real time, server-side, so it cannot be bypassed.

= Key Features =

* **Disposable email detection** — blocks burner addresses from thousands of known providers
* **Free email provider control** — optionally warn or block Gmail, Yahoo, Outlook, and similar
* **MX record validation** — catch addresses that can never actually receive email
* **Fully server-side** — no browser JavaScript required; cannot be bypassed by bots
* **Fail open** — if the LeadCop API is unreachable, forms continue to work normally
* **Live email tester** — try any address from the settings page before going live

= Supported Form Systems =

* WordPress registration and comment forms
* WooCommerce checkout and My Account registration
* Contact Form 7
* WPForms
* Gravity Forms

= Requirements =

You need a **LeadCop account** and an **API key**. Sign up free at [leadcop.io](https://leadcop.io).

== Installation ==

1. Upload the `leadcop-email-validator` folder to `/wp-content/plugins/`
2. Activate the plugin from the **Plugins** screen in WordPress
3. Go to **LeadCop** in the admin menu
4. Enter your **API Key** (get one at [leadcop.io/dashboard](https://leadcop.io/dashboard)) and click **Save Settings**

== Frequently Asked Questions ==

= Does this slow down my forms? =

The API check adds around 200–500 ms to form submissions. This is unnoticeable to users and only happens when the form is actually submitted.

= What happens if the LeadCop API is down? =

The plugin is designed to **fail open** — if the API cannot be reached for any reason, form submissions proceed normally. Your site will never be broken by a third-party outage.

= Can I customise the error messages? =

Yes. Go to **LeadCop → Validation Rules** and edit the message for each rule.

= Does this work with my page builder? =

Any page builder that uses a supported form plugin (CF7, WPForms, Gravity Forms) is covered automatically.

== Changelog ==

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 1.0.0 =
Initial release.
