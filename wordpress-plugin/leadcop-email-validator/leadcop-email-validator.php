<?php
/**
 * Plugin Name:       LeadCop Email Validator
 * Plugin URI:        https://leadcop.io
 * Description:       Block disposable and unwanted email addresses on your WordPress forms using the LeadCop API. Supports WooCommerce, Contact Form 7, WPForms, Gravity Forms, and more.
 * Version:           1.0.0
 * Requires at least: 5.6
 * Requires PHP:      7.4
 * Author:            LeadCop
 * Author URI:        https://leadcop.io
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       leadcop
 */

defined( 'ABSPATH' ) || exit;

define( 'LEADCOP_VERSION', '1.0.0' );
define( 'LEADCOP_PLUGIN_FILE', __FILE__ );
define( 'LEADCOP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'LEADCOP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once LEADCOP_PLUGIN_DIR . 'includes/class-api.php';
require_once LEADCOP_PLUGIN_DIR . 'includes/class-admin.php';
require_once LEADCOP_PLUGIN_DIR . 'includes/class-hooks.php';

/**
 * Initialise the plugin after all plugins are loaded.
 */
function leadcop_init() {
    LeadCop_Admin::init();
    LeadCop_Hooks::init();
}
add_action( 'plugins_loaded', 'leadcop_init' );

/**
 * Activation: set sensible defaults.
 */
function leadcop_activate() {
    $defaults = array(
        'api_key'              => '',
        'api_url'              => 'https://leadcop.io',
        'block_disposable'     => '1',
        'free_email_action'    => 'off',
        'mx_action'            => 'off',
        'msg_disposable'       => __( 'Disposable email addresses are not allowed.', 'leadcop' ),
        'msg_free_email'       => __( 'Free email providers are not accepted. Please use a work email.', 'leadcop' ),
        'msg_mx'               => __( 'This email domain has no mail server — messages may not be delivered.', 'leadcop' ),
        'hook_wp_register'     => '1',
        'hook_wp_comment'      => '1',
        'hook_woo_checkout'    => '1',
        'hook_woo_account'     => '1',
        'hook_cf7'             => '1',
        'hook_wpforms'         => '1',
        'hook_gravityforms'    => '1',
    );
    foreach ( $defaults as $key => $value ) {
        if ( false === get_option( 'leadcop_' . $key ) ) {
            add_option( 'leadcop_' . $key, $value );
        }
    }
}
register_activation_hook( __FILE__, 'leadcop_activate' );

/**
 * Deactivation: nothing to clean up for now.
 */
register_deactivation_hook( __FILE__, '__return_true' );
