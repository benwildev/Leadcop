<?php
/**
 * Plugin Name:       LeadCop Email Validator
 * Plugin URI:        https://leadcop.io
 * Description:       Validate email addresses on WordPress forms using the LeadCop API. Blocks disposable, role-based, and undeliverable addresses. Includes a newsletter subscribe shortcode.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            LeadCop
 * Author URI:        https://leadcop.io
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       leadcop
 */

defined( 'ABSPATH' ) || exit;

define( 'LEADCOP_VERSION', '1.0.0' );
define( 'LEADCOP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'LEADCOP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'LEADCOP_OPTIONS_KEY', 'leadcop_settings' );

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function leadcop_get_option( string $key, $default = '' ) {
	$opts = get_option( LEADCOP_OPTIONS_KEY, [] );
	return $opts[ $key ] ?? $default;
}

/**
 * Call the LeadCop /api/check-email endpoint server-side (keeps API key secret).
 *
 * @param  string $email Email to validate.
 * @return array|WP_Error  Decoded JSON body or WP_Error on failure.
 */
function leadcop_validate_email( string $email ) {
	$api_key  = leadcop_get_option( 'api_key' );
	$base_url = rtrim( leadcop_get_option( 'api_base_url', 'https://leadcop.io' ), '/' );

	if ( empty( $api_key ) ) {
		return new WP_Error( 'no_api_key', __( 'LeadCop API key is not configured.', 'leadcop' ) );
	}

	$response = wp_remote_post(
		$base_url . '/api/check-email',
		[
			'timeout' => 10,
			'headers' => [
				'Content-Type'      => 'application/json',
				'Authorization'     => 'Bearer ' . $api_key,
				'X-LeadCop-Source'  => 'wordpress-plugin',
				'User-Agent'        => 'LeadCop-WP/' . LEADCOP_VERSION,
			],
			'body' => wp_json_encode( [ 'email' => $email ] ),
		]
	);

	if ( is_wp_error( $response ) ) {
		return $response;
	}

	$code = wp_remote_retrieve_response_code( $response );
	$body = json_decode( wp_remote_retrieve_body( $response ), true );

	if ( $code !== 200 || ! is_array( $body ) ) {
		return new WP_Error( 'api_error', __( 'LeadCop API returned an unexpected response.', 'leadcop' ) );
	}

	return $body;
}

/**
 * Decide whether a validation result should be blocked given the plugin settings.
 *
 * @param  array $result  Response from leadcop_validate_email().
 * @return bool           True if the email should be blocked.
 */
function leadcop_should_block( array $result ): bool {
	$flags = $result['result'] ?? [];

	if ( leadcop_get_option( 'block_disposable', '1' ) === '1' && ! empty( $flags['isDisposable'] ) ) {
		return true;
	}
	if ( leadcop_get_option( 'block_role', '1' ) === '1' && ! empty( $flags['isRoleAccount'] ) ) {
		return true;
	}
	if ( leadcop_get_option( 'block_invalid_mx', '1' ) === '1' && isset( $flags['hasMx'] ) && ! $flags['hasMx'] ) {
		return true;
	}
	if ( leadcop_get_option( 'block_smtp_invalid', '0' ) === '1' && isset( $flags['smtpValid'] ) && ! $flags['smtpValid'] ) {
		return true;
	}

	return false;
}

function leadcop_error_message(): string {
	$msg = leadcop_get_option( 'error_message', '' );
	return $msg ?: __( 'This email address is not accepted. Please use a valid, non-disposable email.', 'leadcop' );
}

// ──────────────────────────────────────────────────────────────────────────────
// WordPress Registration Form
// ──────────────────────────────────────────────────────────────────────────────

add_filter( 'registration_errors', 'leadcop_check_registration_email', 10, 3 );

function leadcop_check_registration_email( WP_Error $errors, string $sanitized_user_login, string $user_email ): WP_Error {
	if ( ! leadcop_get_option( 'validate_registration', '1' ) === '1' ) {
		return $errors;
	}
	if ( $errors->get_error_code() || empty( $user_email ) ) {
		return $errors;
	}

	$result = leadcop_validate_email( $user_email );
	if ( is_wp_error( $result ) ) {
		return $errors; // fail open — don't block on API errors
	}

	if ( leadcop_should_block( $result ) ) {
		$errors->add( 'leadcop_invalid_email', leadcop_error_message() );
	}

	return $errors;
}

// ──────────────────────────────────────────────────────────────────────────────
// WordPress Comment Form
// ──────────────────────────────────────────────────────────────────────────────

add_filter( 'preprocess_comment', 'leadcop_check_comment_email' );

function leadcop_check_comment_email( array $commentdata ): array {
	if ( leadcop_get_option( 'validate_comments', '0' ) !== '1' ) {
		return $commentdata;
	}
	$email = $commentdata['comment_author_email'] ?? '';
	if ( empty( $email ) ) {
		return $commentdata;
	}

	$result = leadcop_validate_email( $email );
	if ( is_wp_error( $result ) ) {
		return $commentdata;
	}

	if ( leadcop_should_block( $result ) ) {
		wp_die( esc_html( leadcop_error_message() ), esc_html__( 'Comment Error', 'leadcop' ), [ 'back_link' => true ] );
	}

	return $commentdata;
}

// ──────────────────────────────────────────────────────────────────────────────
// WooCommerce — registration & checkout
// ──────────────────────────────────────────────────────────────────────────────

add_filter( 'woocommerce_registration_errors', 'leadcop_check_woo_registration_email', 10, 3 );

function leadcop_check_woo_registration_email( WP_Error $errors, string $username, string $email ): WP_Error {
	if ( leadcop_get_option( 'validate_woocommerce', '1' ) !== '1' ) {
		return $errors;
	}
	if ( $errors->get_error_code() || empty( $email ) ) {
		return $errors;
	}

	$result = leadcop_validate_email( $email );
	if ( is_wp_error( $result ) ) {
		return $errors;
	}

	if ( leadcop_should_block( $result ) ) {
		$errors->add( 'leadcop_invalid_email', leadcop_error_message() );
	}

	return $errors;
}

add_action( 'woocommerce_checkout_process', 'leadcop_check_woo_checkout_email' );

function leadcop_check_woo_checkout_email(): void {
	if ( leadcop_get_option( 'validate_woocommerce', '1' ) !== '1' ) {
		return;
	}

	$email = isset( $_POST['billing_email'] ) ? sanitize_email( wp_unslash( $_POST['billing_email'] ) ) : '';
	if ( empty( $email ) ) {
		return;
	}

	$result = leadcop_validate_email( $email );
	if ( is_wp_error( $result ) ) {
		return;
	}

	if ( leadcop_should_block( $result ) ) {
		wc_add_notice( leadcop_error_message(), 'error' );
	}
}

// ──────────────────────────────────────────────────────────────────────────────
// Contact Form 7
// ──────────────────────────────────────────────────────────────────────────────

add_filter( 'wpcf7_validate_email', 'leadcop_check_cf7_email', 20, 2 );
add_filter( 'wpcf7_validate_email*', 'leadcop_check_cf7_email', 20, 2 );

function leadcop_check_cf7_email( $result, $tag ) {
	if ( leadcop_get_option( 'validate_cf7', '1' ) !== '1' ) {
		return $result;
	}

	$email = isset( $_POST[ $tag->name ] ) ? sanitize_email( wp_unslash( $_POST[ $tag->name ] ) ) : '';
	if ( empty( $email ) ) {
		return $result;
	}

	$validation = leadcop_validate_email( $email );
	if ( is_wp_error( $validation ) ) {
		return $result;
	}

	if ( leadcop_should_block( $validation ) ) {
		$result->invalidate( $tag, leadcop_error_message() );
	}

	return $result;
}

// ──────────────────────────────────────────────────────────────────────────────
// Newsletter subscribe shortcode  [leadcop_subscribe]
//
// Attributes:
//   button_text  — default "Subscribe"
//   placeholder  — default "Your email address"
//   show_name    — "yes" | "no" (default "no")
//   success_msg  — message shown after successful subscribe
// ──────────────────────────────────────────────────────────────────────────────

add_shortcode( 'leadcop_subscribe', 'leadcop_subscribe_shortcode' );

function leadcop_subscribe_shortcode( $atts ): string {
	$atts = shortcode_atts(
		[
			'button_text'  => __( 'Subscribe', 'leadcop' ),
			'placeholder'  => __( 'Your email address', 'leadcop' ),
			'show_name'    => 'no',
			'success_msg'  => __( 'Thanks for subscribing!', 'leadcop' ),
			'name_placeholder' => __( 'Your name', 'leadcop' ),
		],
		$atts,
		'leadcop_subscribe'
	);

	$show_name = $atts['show_name'] === 'yes';
	$nonce     = wp_create_nonce( 'leadcop_subscribe_nonce' );
	$form_id   = 'leadcop-subscribe-' . wp_rand( 1000, 9999 );

	ob_start();
	?>
	<div class="leadcop-subscribe-wrap" id="<?php echo esc_attr( $form_id ); ?>">
		<form class="leadcop-subscribe-form" data-nonce="<?php echo esc_attr( $nonce ); ?>" novalidate>
			<?php if ( $show_name ) : ?>
			<div class="leadcop-field">
				<input type="text" class="leadcop-name" placeholder="<?php echo esc_attr( $atts['name_placeholder'] ); ?>" autocomplete="name" />
			</div>
			<?php endif; ?>
			<div class="leadcop-field leadcop-email-row">
				<input type="email" class="leadcop-email" placeholder="<?php echo esc_attr( $atts['placeholder'] ); ?>" required autocomplete="email" />
				<button type="submit" class="leadcop-btn"><?php echo esc_html( $atts['button_text'] ); ?></button>
			</div>
			<div class="leadcop-msg" role="alert" aria-live="polite" style="display:none"></div>
		</form>
		<p class="leadcop-success" role="status" style="display:none"><?php echo esc_html( $atts['success_msg'] ); ?></p>
	</div>
	<?php
	wp_enqueue_style( 'leadcop-frontend' );
	wp_enqueue_script( 'leadcop-subscribe' );
	return ob_get_clean();
}

// ──────────────────────────────────────────────────────────────────────────────
// AJAX handler for the subscribe form
// ──────────────────────────────────────────────────────────────────────────────

add_action( 'wp_ajax_leadcop_subscribe', 'leadcop_ajax_subscribe' );
add_action( 'wp_ajax_nopriv_leadcop_subscribe', 'leadcop_ajax_subscribe' );

function leadcop_ajax_subscribe(): void {
	check_ajax_referer( 'leadcop_subscribe_nonce', 'nonce' );

	$email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$name  = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';

	if ( ! is_email( $email ) ) {
		wp_send_json_error( [ 'message' => __( 'Please enter a valid email address.', 'leadcop' ) ] );
	}

	$base_url = rtrim( leadcop_get_option( 'api_base_url', 'https://leadcop.io' ), '/' );

	$body = [ 'email' => $email ];
	if ( ! empty( $name ) ) {
		$body['name'] = $name;
	}

	$response = wp_remote_post(
		$base_url . '/api/newsletter/subscribe',
		[
			'timeout' => 10,
			'headers' => [ 'Content-Type' => 'application/json' ],
			'body'    => wp_json_encode( $body ),
		]
	);

	if ( is_wp_error( $response ) ) {
		wp_send_json_error( [ 'message' => __( 'Could not connect to the newsletter service. Please try again later.', 'leadcop' ) ] );
	}

	$decoded = json_decode( wp_remote_retrieve_body( $response ), true );
	$message = $decoded['message'] ?? '';
	$code    = wp_remote_retrieve_response_code( $response );

	if ( $code === 200 ) {
		wp_send_json_success( [ 'message' => $message ] );
	} else {
		$err = $decoded['error'] ?? __( 'Subscription failed. Please try again.', 'leadcop' );
		wp_send_json_error( [ 'message' => $err ] );
	}
}

// ──────────────────────────────────────────────────────────────────────────────
// Newsletter Widget
// ──────────────────────────────────────────────────────────────────────────────

add_action( 'widgets_init', function () {
	register_widget( 'LeadCop_Subscribe_Widget' );
} );

class LeadCop_Subscribe_Widget extends WP_Widget {

	public function __construct() {
		parent::__construct(
			'leadcop_subscribe_widget',
			__( 'LeadCop Newsletter Subscribe', 'leadcop' ),
			[ 'description' => __( 'A newsletter subscribe form powered by LeadCop.', 'leadcop' ) ]
		);
	}

	public function widget( $args, $instance ): void {
		echo wp_kses_post( $args['before_widget'] );
		$title = ! empty( $instance['title'] ) ? $instance['title'] : '';
		if ( $title ) {
			echo wp_kses_post( $args['before_title'] ) . esc_html( $title ) . wp_kses_post( $args['after_title'] );
		}

		$show_name   = ! empty( $instance['show_name'] ) ? 'yes' : 'no';
		$button_text = ! empty( $instance['button_text'] ) ? $instance['button_text'] : __( 'Subscribe', 'leadcop' );
		$placeholder = ! empty( $instance['placeholder'] ) ? $instance['placeholder'] : __( 'Your email address', 'leadcop' );
		$success_msg = ! empty( $instance['success_msg'] ) ? $instance['success_msg'] : __( 'Thanks for subscribing!', 'leadcop' );

		echo do_shortcode( sprintf(
			'[leadcop_subscribe show_name="%s" button_text="%s" placeholder="%s" success_msg="%s"]',
			esc_attr( $show_name ),
			esc_attr( $button_text ),
			esc_attr( $placeholder ),
			esc_attr( $success_msg )
		) );

		echo wp_kses_post( $args['after_widget'] );
	}

	public function form( $instance ): void {
		$title       = $instance['title'] ?? '';
		$show_name   = ! empty( $instance['show_name'] );
		$button_text = $instance['button_text'] ?? __( 'Subscribe', 'leadcop' );
		$placeholder = $instance['placeholder'] ?? __( 'Your email address', 'leadcop' );
		$success_msg = $instance['success_msg'] ?? __( 'Thanks for subscribing!', 'leadcop' );
		?>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_html_e( 'Title:', 'leadcop' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'placeholder' ) ); ?>"><?php esc_html_e( 'Email placeholder:', 'leadcop' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'placeholder' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'placeholder' ) ); ?>" type="text" value="<?php echo esc_attr( $placeholder ); ?>" />
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'button_text' ) ); ?>"><?php esc_html_e( 'Button text:', 'leadcop' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'button_text' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'button_text' ) ); ?>" type="text" value="<?php echo esc_attr( $button_text ); ?>" />
		</p>
		<p>
			<input id="<?php echo esc_attr( $this->get_field_id( 'show_name' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'show_name' ) ); ?>" type="checkbox" value="1" <?php checked( $show_name ); ?> />
			<label for="<?php echo esc_attr( $this->get_field_id( 'show_name' ) ); ?>"><?php esc_html_e( 'Show name field', 'leadcop' ); ?></label>
		</p>
		<p>
			<label for="<?php echo esc_attr( $this->get_field_id( 'success_msg' ) ); ?>"><?php esc_html_e( 'Success message:', 'leadcop' ); ?></label>
			<input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'success_msg' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'success_msg' ) ); ?>" type="text" value="<?php echo esc_attr( $success_msg ); ?>" />
		</p>
		<?php
	}

	public function update( $new_instance, $old_instance ): array {
		return [
			'title'       => sanitize_text_field( $new_instance['title'] ),
			'placeholder' => sanitize_text_field( $new_instance['placeholder'] ),
			'button_text' => sanitize_text_field( $new_instance['button_text'] ),
			'show_name'   => ! empty( $new_instance['show_name'] ) ? 1 : 0,
			'success_msg' => sanitize_text_field( $new_instance['success_msg'] ),
		];
	}
}

// ──────────────────────────────────────────────────────────────────────────────
// Asset registration
// ──────────────────────────────────────────────────────────────────────────────

add_action( 'wp_enqueue_scripts', 'leadcop_register_assets' );

function leadcop_register_assets(): void {
	wp_register_style(
		'leadcop-frontend',
		LEADCOP_PLUGIN_URL . 'assets/leadcop-frontend.css',
		[],
		LEADCOP_VERSION
	);
	wp_register_script(
		'leadcop-subscribe',
		LEADCOP_PLUGIN_URL . 'assets/leadcop-subscribe.js',
		[],
		LEADCOP_VERSION,
		true
	);
	wp_localize_script(
		'leadcop-subscribe',
		'leadcopAjax',
		[ 'ajaxurl' => admin_url( 'admin-ajax.php' ) ]
	);
}

add_action( 'wp_footer', 'leadcop_inject_frontend_script' );

function leadcop_inject_frontend_script(): void {
	$api_key  = leadcop_get_option( 'api_key' );
	$base_url = rtrim( leadcop_get_option( 'api_base_url', 'https://leadcop.io' ), '/' );

	if ( empty( $api_key ) ) {
		return;
	}

	$script_url = $base_url . '/temp-email-validator.js';
	$error_msg  = esc_attr( leadcop_error_message() );

	printf(
		'<script src="%s" data-api-key="%s" data-api-url="%s" data-error-message="%s"></script>' . "\n",
		esc_url( $script_url ),
		esc_attr( $api_key ),
		esc_url( $base_url ),
		$error_msg
	);
}

// ──────────────────────────────────────────────────────────────────────────────
// Admin settings page
// ──────────────────────────────────────────────────────────────────────────────

add_action( 'admin_menu', 'leadcop_admin_menu' );

function leadcop_admin_menu(): void {
	add_options_page(
		__( 'LeadCop Email Validator', 'leadcop' ),
		__( 'LeadCop', 'leadcop' ),
		'manage_options',
		'leadcop-settings',
		'leadcop_settings_page'
	);
}

add_action( 'admin_notices', 'leadcop_admin_notices' );

function leadcop_admin_notices(): void {
	if ( ! isset( $_GET['page'] ) || $_GET['page'] !== 'leadcop-settings' ) {
		return;
	}

	$api_key  = leadcop_get_option( 'api_key' );
	$base_url = rtrim( leadcop_get_option( 'api_base_url', 'https://leadcop.io' ), '/' );

	if ( empty( $api_key ) ) {
		echo '<div class="notice notice-warning"><p>' . esc_html__( 'Please enter your LeadCop API key to enable validation.', 'leadcop' ) . '</p></div>';
		return;
	}

	// Test API connection with the Origin and Referer headers to simulate frontend scripts.
	// We use an invalid email address ('ping') so it fails validation before deducting a credit.
	$test_path = '/leadcop-plugin-setup-test';
	$response = wp_remote_post(
		$base_url . '/api/check-email',
		[
			'timeout' => 5,
			'headers' => [
				'Content-Type'  => 'application/json',
				'Authorization' => 'Bearer ' . $api_key,
				'Origin'        => home_url(),
				'Referer'       => home_url( $test_path ),
			],
			'body' => wp_json_encode( [ 'email' => 'ping' ] ),
		]
	);

	if ( is_wp_error( $response ) ) {
		echo '<div class="notice notice-error"><p>' . esc_html__( 'Could not connect to LeadCop API. Error: ', 'leadcop' ) . esc_html( $response->get_error_message() ) . '</p></div>';
		return;
	}

	$code = wp_remote_retrieve_response_code( $response );
	$body = json_decode( wp_remote_retrieve_body( $response ), true );

	if ( $code === 401 ) {
		echo '<div class="notice notice-error"><p>' . esc_html__( 'LeadCop API Error: Invalid API key.', 'leadcop' ) . '</p></div>';
	} elseif ( $code === 403 ) {
		$error_msg = $body['error'] ?? 'Access Denied';
		// If the error mentions our specific test path, it means Origin succeeded but Page Restriction is active!
		if ( strpos( $error_msg, $test_path ) !== false ) {
			if ( isset( $_GET['settings-updated'] ) && $_GET['settings-updated'] ) {
				echo '<div class="notice notice-warning is-dismissible"><p><strong>' . esc_html__( 'LeadCop Connected, but Page Restrictions are ON:', 'leadcop' ) . '</strong> ' . esc_html__( 'Your API key and Origin are correct, but you have "Protected Pages" enabled in your dashboard. Make sure you add the actual URLs of your forms (e.g. /contact/) to your dashboard, otherwise frontend validation will be blocked!', 'leadcop' ) . '</p></div>';
			}
		} else {
			echo '<div class="notice notice-error"><p><strong>' . esc_html__( 'LeadCop Plugin Setup Incomplete:', 'leadcop' ) . '</strong> ' . esc_html( $error_msg ) . '</p></div>';
		}
	} elseif ( $code === 400 || $code === 200 ) {
		// 400 means origin, referer and API key checks passed natively, but the 'ping' email failed validation as planned.
		if ( isset( $_GET['settings-updated'] ) && $_GET['settings-updated'] ) {
			echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'LeadCop API connection successful! Your website is fully protected.', 'leadcop' ) . '</p></div>';
		}
	}
}

add_action( 'admin_init', 'leadcop_register_settings' );

function leadcop_register_settings(): void {
	register_setting( 'leadcop_settings_group', LEADCOP_OPTIONS_KEY, 'leadcop_sanitize_settings' );

	// API section
	add_settings_section( 'leadcop_api', __( 'API Connection', 'leadcop' ), '__return_false', 'leadcop-settings' );
	add_settings_field( 'api_key',      __( 'API Key', 'leadcop' ),         'leadcop_field_api_key',      'leadcop-settings', 'leadcop_api' );
	add_settings_field( 'api_base_url', __( 'API Base URL', 'leadcop' ),    'leadcop_field_api_base_url', 'leadcop-settings', 'leadcop_api' );

	// Validation section
	add_settings_section( 'leadcop_validation', __( 'Validation Rules', 'leadcop' ), '__return_false', 'leadcop-settings' );
	add_settings_field( 'block_disposable',  __( 'Block disposable emails', 'leadcop' ),        'leadcop_field_block_disposable',  'leadcop-settings', 'leadcop_validation' );
	add_settings_field( 'block_role',        __( 'Block role-based emails', 'leadcop' ),         'leadcop_field_block_role',        'leadcop-settings', 'leadcop_validation' );
	add_settings_field( 'block_invalid_mx',  __( 'Block emails with no MX record', 'leadcop' ), 'leadcop_field_block_invalid_mx',  'leadcop-settings', 'leadcop_validation' );
	add_settings_field( 'block_smtp_invalid',__( 'Block undeliverable mailboxes (SMTP)', 'leadcop' ), 'leadcop_field_block_smtp', 'leadcop-settings', 'leadcop_validation' );
	add_settings_field( 'error_message',     __( 'Error message', 'leadcop' ),                  'leadcop_field_error_message',     'leadcop-settings', 'leadcop_validation' );

	// Form integrations section
	add_settings_section( 'leadcop_forms', __( 'Form Integrations', 'leadcop' ), '__return_false', 'leadcop-settings' );
	add_settings_field( 'validate_registration', __( 'WordPress registration', 'leadcop' ),    'leadcop_field_validate_registration', 'leadcop-settings', 'leadcop_forms' );
	add_settings_field( 'validate_comments',     __( 'WordPress comments', 'leadcop' ),        'leadcop_field_validate_comments',     'leadcop-settings', 'leadcop_forms' );
	add_settings_field( 'validate_woocommerce',  __( 'WooCommerce checkout & registration', 'leadcop' ), 'leadcop_field_validate_woo', 'leadcop-settings', 'leadcop_forms' );
	add_settings_field( 'validate_cf7',          __( 'Contact Form 7 email fields', 'leadcop' ), 'leadcop_field_validate_cf7',        'leadcop-settings', 'leadcop_forms' );
}

function leadcop_sanitize_settings( $input ): array {
	$clean = [];
	$clean['api_key']              = sanitize_text_field( $input['api_key'] ?? '' );
	$clean['api_base_url']         = esc_url_raw( $input['api_base_url'] ?? 'https://leadcop.io' );
	$clean['error_message']        = sanitize_text_field( $input['error_message'] ?? '' );
	$clean['block_disposable']     = ! empty( $input['block_disposable'] ) ? '1' : '0';
	$clean['block_role']           = ! empty( $input['block_role'] ) ? '1' : '0';
	$clean['block_invalid_mx']     = ! empty( $input['block_invalid_mx'] ) ? '1' : '0';
	$clean['block_smtp_invalid']   = ! empty( $input['block_smtp_invalid'] ) ? '1' : '0';
	$clean['validate_registration']= ! empty( $input['validate_registration'] ) ? '1' : '0';
	$clean['validate_comments']    = ! empty( $input['validate_comments'] ) ? '1' : '0';
	$clean['validate_woocommerce'] = ! empty( $input['validate_woocommerce'] ) ? '1' : '0';
	$clean['validate_cf7']         = ! empty( $input['validate_cf7'] ) ? '1' : '0';
	return $clean;
}

// ── Field renderers ───────────────────────────────────────────────────────────

function leadcop_field_api_key(): void {
	$val = leadcop_get_option( 'api_key' );
	printf(
		'<input type="password" id="leadcop_api_key" name="%s[api_key]" value="%s" class="regular-text" autocomplete="off" />' .
		'<p class="description">%s <a href="https://leadcop.io/dashboard" target="_blank">%s</a></p>',
		esc_attr( LEADCOP_OPTIONS_KEY ),
		esc_attr( $val ),
		esc_html__( 'Find your API key in the', 'leadcop' ),
		esc_html__( 'LeadCop dashboard', 'leadcop' )
	);
}

function leadcop_field_api_base_url(): void {
	$val = leadcop_get_option( 'api_base_url', 'https://leadcop.io' );
	printf(
		'<input type="url" id="leadcop_api_base_url" name="%s[api_base_url]" value="%s" class="regular-text" placeholder="https://leadcop.io" />',
		esc_attr( LEADCOP_OPTIONS_KEY ),
		esc_attr( $val )
	);
}

function leadcop_field_block_disposable(): void {
	leadcop_checkbox_field( 'block_disposable', '1', __( 'Reject single-use / temporary email addresses', 'leadcop' ) );
}
function leadcop_field_block_role(): void {
	leadcop_checkbox_field( 'block_role', '1', __( 'Reject role addresses (e.g. info@, admin@, noreply@)', 'leadcop' ) );
}
function leadcop_field_block_invalid_mx(): void {
	leadcop_checkbox_field( 'block_invalid_mx', '1', __( 'Reject domains with no valid mail server (MX record)', 'leadcop' ) );
}
function leadcop_field_block_smtp(): void {
	leadcop_checkbox_field( 'block_smtp_invalid', '0', __( 'Reject mailboxes confirmed undeliverable via SMTP (slower; uses extra API credits)', 'leadcop' ) );
}

function leadcop_checkbox_field( string $key, string $default, string $label ): void {
	$checked = leadcop_get_option( $key, $default ) === '1';
	printf(
		'<label><input type="checkbox" name="%s[%s]" value="1" %s /> %s</label>',
		esc_attr( LEADCOP_OPTIONS_KEY ),
		esc_attr( $key ),
		checked( $checked, true, false ),
		esc_html( $label )
	);
}

function leadcop_field_error_message(): void {
	$val = leadcop_get_option( 'error_message' );
	printf(
		'<input type="text" name="%s[error_message]" value="%s" class="large-text" placeholder="%s" />',
		esc_attr( LEADCOP_OPTIONS_KEY ),
		esc_attr( $val ),
		esc_attr__( 'This email address is not accepted. Please use a valid, non-disposable email.', 'leadcop' )
	);
}

function leadcop_field_validate_registration(): void {
	leadcop_checkbox_field( 'validate_registration', '1', __( 'Enable validation on the WordPress user registration form', 'leadcop' ) );
}
function leadcop_field_validate_comments(): void {
	leadcop_checkbox_field( 'validate_comments', '0', __( 'Enable validation on the WordPress comment form', 'leadcop' ) );
}
function leadcop_field_validate_woo(): void {
	leadcop_checkbox_field( 'validate_woocommerce', '1', __( 'Enable validation on WooCommerce registration and checkout (requires WooCommerce)', 'leadcop' ) );
}
function leadcop_field_validate_cf7(): void {
	leadcop_checkbox_field( 'validate_cf7', '1', __( 'Enable validation on Contact Form 7 email fields (requires CF7)', 'leadcop' ) );
}

function leadcop_settings_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'LeadCop Email Validator', 'leadcop' ); ?></h1>
		<p><?php esc_html_e( 'Configure your LeadCop integration to validate email addresses across your WordPress site.', 'leadcop' ); ?></p>
		<form method="post" action="options.php">
			<?php
			settings_fields( 'leadcop_settings_group' );
			do_settings_sections( 'leadcop-settings' );
			submit_button();
			?>
		</form>

		<hr />
		<h2><?php esc_html_e( 'Newsletter Shortcode', 'leadcop' ); ?></h2>
		<p><?php esc_html_e( 'Add a newsletter subscribe form anywhere on your site using the shortcode below:', 'leadcop' ); ?></p>
		<code>[leadcop_subscribe]</code>
		<p><?php esc_html_e( 'Optional attributes:', 'leadcop' ); ?></p>
		<ul style="list-style:disc;margin-left:1.5em">
			<li><code>show_name="yes"</code> — <?php esc_html_e( 'show a name field', 'leadcop' ); ?></li>
			<li><code>button_text="Join now"</code> — <?php esc_html_e( 'custom button label', 'leadcop' ); ?></li>
			<li><code>placeholder="Enter your email"</code></li>
			<li><code>success_msg="You're in!"</code></li>
		</ul>
		<p><?php esc_html_e( 'You can also add the "LeadCop Newsletter Subscribe" widget to any widget area.', 'leadcop' ); ?></p>
	</div>
	<?php
}

// ──────────────────────────────────────────────────────────────────────────────
// Activation / Deactivation
// ──────────────────────────────────────────────────────────────────────────────

register_activation_hook( __FILE__, 'leadcop_activate' );

function leadcop_activate(): void {
	$defaults = [
		'api_key'               => '',
		'api_base_url'          => 'https://leadcop.io',
		'error_message'         => '',
		'block_disposable'      => '1',
		'block_role'            => '1',
		'block_invalid_mx'      => '1',
		'block_smtp_invalid'    => '0',
		'validate_registration' => '1',
		'validate_comments'     => '0',
		'validate_woocommerce'  => '1',
		'validate_cf7'          => '1',
	];
	if ( ! get_option( LEADCOP_OPTIONS_KEY ) ) {
		add_option( LEADCOP_OPTIONS_KEY, $defaults );
	}
}

register_deactivation_hook( __FILE__, 'leadcop_deactivate' );

function leadcop_deactivate(): void {
	// Nothing to clean up — settings are preserved.
}
