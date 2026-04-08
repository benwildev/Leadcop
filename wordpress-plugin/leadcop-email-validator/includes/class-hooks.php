<?php
defined( 'ABSPATH' ) || exit;

class LeadCop_Hooks {

    private static $decision_cache = array();

    // Per-request warning state for integrations whose output hook
    // fires in the same PHP request as their validation hook.
    private static $cf7_warn      = '';
    private static $wpforms_warn  = array();
    private static $gf_warn       = array();

    public static function init() {
        if ( get_option( 'leadcop_hook_wp_register', '1' ) === '1' ) {
            add_filter( 'registration_errors', array( __CLASS__, 'validate_wp_register' ), 10, 3 );
            add_filter( 'login_message', array( __CLASS__, 'render_login_warn' ) );
        }

        if ( get_option( 'leadcop_hook_wp_comment', '1' ) === '1' ) {
            add_filter( 'preprocess_comment', array( __CLASS__, 'validate_wp_comment' ) );
        }

        if ( class_exists( 'WooCommerce' ) ) {
            if ( get_option( 'leadcop_hook_woo_checkout', '1' ) === '1' ) {
                add_action( 'woocommerce_checkout_process', array( __CLASS__, 'validate_woo_checkout' ) );
            }
            if ( get_option( 'leadcop_hook_woo_account', '1' ) === '1' ) {
                add_filter( 'woocommerce_registration_errors', array( __CLASS__, 'validate_woo_register' ), 10, 3 );
            }
        }

        if ( class_exists( 'WPCF7' ) && get_option( 'leadcop_hook_cf7', '1' ) === '1' ) {
            add_filter( 'wpcf7_validate_email',  array( __CLASS__, 'validate_cf7_email' ), 20, 2 );
            add_filter( 'wpcf7_validate_email*', array( __CLASS__, 'validate_cf7_email' ), 20, 2 );
            add_filter( 'wpcf7_form_response_output', array( __CLASS__, 'render_cf7_warn' ), 20, 4 );
        }

        if ( function_exists( 'wpforms' ) && get_option( 'leadcop_hook_wpforms', '1' ) === '1' ) {
            add_action( 'wpforms_process_validate_email', array( __CLASS__, 'validate_wpforms_email' ), 10, 3 );
            add_filter( 'wpforms_confirmation_message', array( __CLASS__, 'render_wpforms_warn' ), 10, 4 );
        }

        if ( class_exists( 'GFCommon' ) && get_option( 'leadcop_hook_gravityforms', '1' ) === '1' ) {
            add_filter( 'gform_field_validation', array( __CLASS__, 'validate_gravity_email' ), 10, 4 );
            add_filter( 'gform_confirmation', array( __CLASS__, 'render_gravity_warn' ), 10, 4 );
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────────

    private static function get_decision( $email ) {
        $email = sanitize_email( $email );
        if ( ! isset( self::$decision_cache[ $email ] ) ) {
            $result = LeadCop_API::check_email( $email );
            self::$decision_cache[ $email ] = LeadCop_API::evaluate( $result );
        }
        return self::$decision_cache[ $email ];
    }

    private static function warn_style() {
        return 'color:#92400e;background:#fffbeb;border:1px solid #fcd34d;padding:10px 14px;border-radius:6px;margin:12px 0;font-size:0.9em;';
    }

    // ── WordPress registration ────────────────────────────────────────────────────

    public static function validate_wp_register( $errors, $sanitized_user_login, $user_email ) {
        if ( $errors->get_error_code() ) {
            return $errors;
        }
        $d = self::get_decision( $user_email );
        if ( $d['block'] ) {
            $errors->add( 'leadcop_email_error', esc_html( $d['message'] ) );
        } elseif ( $d['warn'] ) {
            // Successful registration redirects to wp-login.php; surface the
            // warning there via the login_message filter using a short-lived transient.
            $key = 'leadcop_rwarn_' . substr( md5( microtime() . wp_rand() ), 0, 8 );
            set_transient( $key, $d['message'], 120 );
            set_transient( 'leadcop_rwarn_key', $key, 120 );
        }
        return $errors;
    }

    public static function render_login_warn( $message ) {
        $key = get_transient( 'leadcop_rwarn_key' );
        if ( ! $key ) {
            return $message;
        }
        $warn = get_transient( $key );
        if ( $warn ) {
            delete_transient( $key );
            delete_transient( 'leadcop_rwarn_key' );
            $message .= '<p class="message" style="' . self::warn_style() . '">' . esc_html( $warn ) . '</p>';
        }
        return $message;
    }

    // ── WordPress comments ────────────────────────────────────────────────────────

    public static function validate_wp_comment( $commentdata ) {
        if ( empty( $commentdata['comment_author_email'] ) ) {
            return $commentdata;
        }
        $d = self::get_decision( $commentdata['comment_author_email'] );
        if ( $d['block'] ) {
            wp_die( esc_html( $d['message'] ), esc_html__( 'Email Error', 'leadcop' ), array( 'back_link' => true ) );
        } elseif ( $d['warn'] ) {
            // Comment proceeds. Store warning as comment meta (visible in admin).
            add_action( 'comment_post', array( __CLASS__, 'save_comment_warn_meta' ) );
        }
        return $commentdata;
    }

    public static function save_comment_warn_meta( $comment_id ) {
        $comment = get_comment( $comment_id );
        if ( ! $comment ) {
            return;
        }
        $d = self::get_decision( $comment->comment_author_email );
        if ( $d['warn'] ) {
            add_comment_meta( $comment_id, '_leadcop_warning', $d['message'], true );
        }
    }

    // ── WooCommerce checkout ──────────────────────────────────────────────────────

    public static function validate_woo_checkout() {
        $email = isset( $_POST['billing_email'] ) ? sanitize_email( wp_unslash( $_POST['billing_email'] ) ) : '';
        if ( ! $email ) {
            return;
        }
        $d = self::get_decision( $email );
        if ( $d['block'] ) {
            wc_add_notice( esc_html( $d['message'] ), 'error' );
        } elseif ( $d['warn'] ) {
            wc_add_notice( esc_html( $d['message'] ), 'notice' );
        }
    }

    // ── WooCommerce My Account registration ──────────────────────────────────────

    public static function validate_woo_register( $errors, $username, $email ) {
        if ( $errors->get_error_code() ) {
            return $errors;
        }
        $d = self::get_decision( $email );
        if ( $d['block'] ) {
            $errors->add( 'leadcop_email_error', esc_html( $d['message'] ) );
        } elseif ( $d['warn'] ) {
            wc_add_notice( esc_html( $d['message'] ), 'notice' );
        }
        return $errors;
    }

    // ── Contact Form 7 ────────────────────────────────────────────────────────────

    public static function validate_cf7_email( $result, $tag ) {
        $email = isset( $_POST[ $tag->name ] ) ? sanitize_email( wp_unslash( $_POST[ $tag->name ] ) ) : '';
        if ( ! $email ) {
            return $result;
        }
        $d = self::get_decision( $email );
        if ( $d['block'] ) {
            $result->invalidate( $tag, esc_html( $d['message'] ) );
        } elseif ( $d['warn'] ) {
            // Store for render_cf7_warn(); both hooks run in the same AJAX request.
            self::$cf7_warn = $d['message'];
        }
        return $result;
    }

    /**
     * Append warning text to the CF7 success response output shown to the user.
     * Fires via the wpcf7_form_response_output filter during AJAX response rendering.
     */
    public static function render_cf7_warn( $output, $class, $content, $form ) {
        if ( self::$cf7_warn && false !== strpos( $class, 'sent' ) ) {
            $output .= '<p class="leadcop-warn-msg" style="' . self::warn_style() . '">' . esc_html( self::$cf7_warn ) . '</p>';
            self::$cf7_warn = '';
        }
        return $output;
    }

    // ── WPForms ───────────────────────────────────────────────────────────────────

    public static function validate_wpforms_email( $field_id, $field_submit, $form_data ) {
        $email = sanitize_email( $field_submit );
        if ( ! $email ) {
            return;
        }
        $d = self::get_decision( $email );
        if ( $d['block'] ) {
            wpforms()->process->errors[ $form_data['id'] ][ $field_id ] = esc_html( $d['message'] );
        } elseif ( $d['warn'] ) {
            self::$wpforms_warn[ $form_data['id'] ] = $d['message'];
        }
    }

    /**
     * Append warning text to the WPForms confirmation message shown to the user.
     * Fires via the wpforms_confirmation_message filter.
     */
    public static function render_wpforms_warn( $message, $form_data, $fields, $entry_id ) {
        $form_id = $form_data['id'];
        if ( ! empty( self::$wpforms_warn[ $form_id ] ) ) {
            $warn = self::$wpforms_warn[ $form_id ];
            unset( self::$wpforms_warn[ $form_id ] );
            $message .= '<p class="leadcop-warn-msg" style="' . self::warn_style() . '">' . esc_html( $warn ) . '</p>';
        }
        return $message;
    }

    // ── Gravity Forms ─────────────────────────────────────────────────────────────

    public static function validate_gravity_email( $result, $value, $form, $field ) {
        if ( $field->type !== 'email' ) {
            return $result;
        }
        $email = sanitize_email( $value );
        if ( ! $email ) {
            return $result;
        }
        $d = self::get_decision( $email );
        if ( $d['block'] ) {
            $result['is_valid'] = false;
            $result['message']  = esc_html( $d['message'] );
        } elseif ( $d['warn'] ) {
            self::$gf_warn[ $form['id'] ] = $d['message'];
        }
        return $result;
    }

    /**
     * Append warning text to the Gravity Forms confirmation message shown to the user.
     * Fires via the gform_confirmation filter after successful submission.
     */
    public static function render_gravity_warn( $confirmation, $form, $entry, $ajax ) {
        $form_id = $form['id'];
        if ( ! empty( self::$gf_warn[ $form_id ] ) ) {
            $warn = self::$gf_warn[ $form_id ];
            unset( self::$gf_warn[ $form_id ] );
            $inline = '<p class="leadcop-warn-msg" style="' . self::warn_style() . '">' . esc_html( $warn ) . '</p>';
            if ( is_array( $confirmation ) ) {
                // Redirect-type confirmation; append to message if present.
                if ( isset( $confirmation['message'] ) ) {
                    $confirmation['message'] .= $inline;
                }
            } else {
                $confirmation .= $inline;
            }
        }
        return $confirmation;
    }
}
