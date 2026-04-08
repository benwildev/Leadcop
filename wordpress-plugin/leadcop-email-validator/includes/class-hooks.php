<?php
defined( 'ABSPATH' ) || exit;

/**
 * Attaches email validation to supported form systems.
 * Every integration is individually gated by the corresponding
 * "hook_*" option in the plugin settings.
 */
class LeadCop_Hooks {

    public static function init() {
        // WordPress core — registration
        if ( get_option( 'leadcop_hook_wp_register', '1' ) === '1' ) {
            add_filter( 'registration_errors', array( __CLASS__, 'validate_wp_register' ), 10, 3 );
        }

        // WordPress core — comments
        if ( get_option( 'leadcop_hook_wp_comment', '1' ) === '1' ) {
            add_filter( 'preprocess_comment', array( __CLASS__, 'validate_wp_comment' ) );
        }

        // WooCommerce checkout
        if ( class_exists( 'WooCommerce' ) ) {
            if ( get_option( 'leadcop_hook_woo_checkout', '1' ) === '1' ) {
                add_action( 'woocommerce_checkout_process', array( __CLASS__, 'validate_woo_checkout' ) );
            }
            if ( get_option( 'leadcop_hook_woo_account', '1' ) === '1' ) {
                add_filter( 'woocommerce_registration_errors', array( __CLASS__, 'validate_woo_register' ), 10, 3 );
            }
        }

        // Contact Form 7
        if ( class_exists( 'WPCF7' ) && get_option( 'leadcop_hook_cf7', '1' ) === '1' ) {
            add_filter( 'wpcf7_validate_email', array( __CLASS__, 'validate_cf7_email' ), 20, 2 );
            add_filter( 'wpcf7_validate_email*', array( __CLASS__, 'validate_cf7_email' ), 20, 2 );
        }

        // WPForms
        if ( function_exists( 'wpforms' ) && get_option( 'leadcop_hook_wpforms', '1' ) === '1' ) {
            add_action( 'wpforms_process_validate_email', array( __CLASS__, 'validate_wpforms_email' ), 10, 3 );
        }

        // Gravity Forms
        if ( class_exists( 'GFCommon' ) && get_option( 'leadcop_hook_gravityforms', '1' ) === '1' ) {
            add_filter( 'gform_field_validation', array( __CLASS__, 'validate_gravity_email' ), 10, 4 );
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Run the API check and return an error message string, or '' if OK.
     */
    private static function get_error_message( $email ) {
        $result   = LeadCop_API::check_email( $email );
        $decision = LeadCop_API::evaluate( $result );

        if ( $decision['block'] ) {
            return $decision['message'];
        }
        return '';
    }

    // ─── WordPress Registration ──────────────────────────────────────────────────

    public static function validate_wp_register( $errors, $sanitized_user_login, $user_email ) {
        if ( $errors->get_error_code() ) {
            return $errors; // bail if WP already found issues
        }
        $msg = self::get_error_message( $user_email );
        if ( $msg ) {
            $errors->add( 'leadcop_email_error', $msg );
        }
        return $errors;
    }

    // ─── WordPress Comments ──────────────────────────────────────────────────────

    public static function validate_wp_comment( $commentdata ) {
        if ( ! empty( $commentdata['comment_author_email'] ) ) {
            $msg = self::get_error_message( $commentdata['comment_author_email'] );
            if ( $msg ) {
                wp_die( esc_html( $msg ), esc_html__( 'Email Error', 'leadcop' ), array( 'back_link' => true ) );
            }
        }
        return $commentdata;
    }

    // ─── WooCommerce Checkout ────────────────────────────────────────────────────

    public static function validate_woo_checkout() {
        $billing_email = isset( $_POST['billing_email'] ) ? sanitize_email( wp_unslash( $_POST['billing_email'] ) ) : '';
        if ( $billing_email ) {
            $msg = self::get_error_message( $billing_email );
            if ( $msg ) {
                wc_add_notice( esc_html( $msg ), 'error' );
            }
        }
    }

    // ─── WooCommerce My Account Registration ────────────────────────────────────

    public static function validate_woo_register( $errors, $username, $email ) {
        if ( $errors->get_error_code() ) {
            return $errors;
        }
        $msg = self::get_error_message( $email );
        if ( $msg ) {
            $errors->add( 'leadcop_email_error', $msg );
        }
        return $errors;
    }

    // ─── Contact Form 7 ─────────────────────────────────────────────────────────

    public static function validate_cf7_email( $result, $tag ) {
        $email = isset( $_POST[ $tag->name ] ) ? sanitize_email( wp_unslash( $_POST[ $tag->name ] ) ) : '';
        if ( $email ) {
            $msg = self::get_error_message( $email );
            if ( $msg ) {
                $result->invalidate( $tag, esc_html( $msg ) );
            }
        }
        return $result;
    }

    // ─── WPForms ────────────────────────────────────────────────────────────────

    public static function validate_wpforms_email( $field_id, $field_submit, $form_data ) {
        $email = sanitize_email( $field_submit );
        if ( $email ) {
            $msg = self::get_error_message( $email );
            if ( $msg ) {
                wpforms()->process->errors[ $form_data['id'] ][ $field_id ] = esc_html( $msg );
            }
        }
    }

    // ─── Gravity Forms ───────────────────────────────────────────────────────────

    public static function validate_gravity_email( $result, $value, $form, $field ) {
        if ( $field->type !== 'email' ) {
            return $result;
        }
        $email = sanitize_email( $value );
        if ( $email ) {
            $msg = self::get_error_message( $email );
            if ( $msg ) {
                $result['is_valid'] = false;
                $result['message']  = esc_html( $msg );
            }
        }
        return $result;
    }
}
