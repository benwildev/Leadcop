<?php
defined( 'ABSPATH' ) || exit;

/**
 * Handles communication with the LeadCop REST API.
 */
class LeadCop_API {

    /**
     * Check a single email address.
     *
     * @param string $email
     * @return array|WP_Error  Decoded API response array, or WP_Error on failure.
     */
    public static function check_email( $email ) {
        $api_key = get_option( 'leadcop_api_key', '' );
        $api_url = rtrim( get_option( 'leadcop_api_url', 'https://leadcop.io' ), '/' );

        if ( empty( $api_key ) ) {
            return new WP_Error( 'leadcop_no_key', __( 'LeadCop API key is not configured.', 'leadcop' ) );
        }

        $response = wp_remote_post(
            $api_url . '/api/check-email',
            array(
                'timeout'     => 5,
                'redirection' => 0,
                'headers'     => array(
                    'Content-Type'  => 'application/json',
                    'Authorization' => 'Bearer ' . $api_key,
                ),
                'body'        => wp_json_encode( array( 'email' => sanitize_email( $email ) ) ),
            )
        );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code === 401 ) {
            return new WP_Error( 'leadcop_auth', __( 'Invalid LeadCop API key. Please check your plugin settings.', 'leadcop' ) );
        }

        if ( $code === 429 ) {
            // Rate-limited — fail open so legitimate users are not blocked
            return array( 'isDisposable' => false, '_rate_limited' => true );
        }

        if ( $code !== 200 || ! is_array( $body ) ) {
            // Fail open on unexpected errors
            return array( 'isDisposable' => false, '_error' => true );
        }

        return $body;
    }

    /**
     * Evaluate the API response against the admin's configured rules.
     *
     * Returns an array:
     *   [ 'block' => bool, 'warn' => bool, 'message' => string ]
     */
    public static function evaluate( $api_result ) {
        if ( is_wp_error( $api_result ) ) {
            // Configuration error — surface it so the admin knows
            if ( $api_result->get_error_code() === 'leadcop_no_key' ) {
                return array( 'block' => false, 'warn' => false, 'message' => '' );
            }
            // Network error — fail open
            return array( 'block' => false, 'warn' => false, 'message' => '' );
        }

        $block_disposable  = get_option( 'leadcop_block_disposable', '1' ) === '1';
        $free_email_action = get_option( 'leadcop_free_email_action', 'off' ); // off | warn | block
        $mx_action         = get_option( 'leadcop_mx_action', 'off' );         // off | warn | block

        $msg_disposable  = get_option( 'leadcop_msg_disposable', __( 'Disposable email addresses are not allowed.', 'leadcop' ) );
        $msg_free_email  = get_option( 'leadcop_msg_free_email', __( 'Free email providers are not accepted. Please use a work email.', 'leadcop' ) );
        $msg_mx          = get_option( 'leadcop_msg_mx', __( 'This email domain has no mail server — messages may not be delivered.', 'leadcop' ) );

        $is_disposable = ! empty( $api_result['isDisposable'] );
        $is_free       = ! empty( $api_result['isFreeEmail'] );
        $mx_valid      = isset( $api_result['mxValid'] ) ? $api_result['mxValid'] : null;

        // Priority: disposable > free email > mx
        if ( $block_disposable && $is_disposable ) {
            return array( 'block' => true, 'warn' => false, 'message' => $msg_disposable );
        }

        if ( $free_email_action === 'block' && $is_free ) {
            return array( 'block' => true, 'warn' => false, 'message' => $msg_free_email );
        }

        if ( $free_email_action === 'warn' && $is_free ) {
            return array( 'block' => false, 'warn' => true, 'message' => $msg_free_email );
        }

        if ( $mx_action === 'block' && $mx_valid === false ) {
            return array( 'block' => true, 'warn' => false, 'message' => $msg_mx );
        }

        if ( $mx_action === 'warn' && $mx_valid === false ) {
            return array( 'block' => false, 'warn' => true, 'message' => $msg_mx );
        }

        return array( 'block' => false, 'warn' => false, 'message' => '' );
    }
}
