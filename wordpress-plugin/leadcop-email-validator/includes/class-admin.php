<?php
defined( 'ABSPATH' ) || exit;

/**
 * Handles the WordPress admin settings page for LeadCop.
 */
class LeadCop_Admin {

    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'add_menu' ) );
        add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
        add_action( 'wp_ajax_leadcop_test_email', array( __CLASS__, 'ajax_test_email' ) );
    }

    public static function add_menu() {
        add_menu_page(
            __( 'LeadCop Email Validator', 'leadcop' ),
            __( 'LeadCop', 'leadcop' ),
            'manage_options',
            'leadcop',
            array( __CLASS__, 'render_page' ),
            'dashicons-shield-alt',
            75
        );
    }

    public static function register_settings() {
        $fields = array(
            'api_key', 'api_url',
            'block_disposable', 'free_email_action', 'mx_action',
            'msg_disposable', 'msg_free_email', 'msg_mx',
            'hook_wp_register', 'hook_wp_comment',
            'hook_woo_checkout', 'hook_woo_account',
            'hook_cf7', 'hook_wpforms', 'hook_gravityforms',
        );
        foreach ( $fields as $field ) {
            register_setting( 'leadcop_settings', 'leadcop_' . $field, array( 'sanitize_callback' => 'sanitize_text_field' ) );
        }
    }

    public static function enqueue_assets( $hook ) {
        if ( $hook !== 'toplevel_page_leadcop' ) {
            return;
        }
        wp_enqueue_style( 'leadcop-admin', LEADCOP_PLUGIN_URL . 'assets/admin.css', array(), LEADCOP_VERSION );
        wp_enqueue_script( 'leadcop-admin', LEADCOP_PLUGIN_URL . 'assets/admin.js', array( 'jquery' ), LEADCOP_VERSION, true );
        wp_localize_script( 'leadcop-admin', 'leadcopAdmin', array(
            'ajaxUrl' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( 'leadcop_test_email' ),
        ) );
    }

    public static function ajax_test_email() {
        check_ajax_referer( 'leadcop_test_email', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => __( 'Unauthorized.', 'leadcop' ) ) );
        }
        $email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
        if ( ! is_email( $email ) ) {
            wp_send_json_error( array( 'message' => __( 'Please enter a valid email address.', 'leadcop' ) ) );
        }
        $result   = LeadCop_API::check_email( $email );
        $decision = LeadCop_API::evaluate( $result );

        if ( is_wp_error( $result ) ) {
            wp_send_json_error( array( 'message' => $result->get_error_message() ) );
        }

        wp_send_json_success( array(
            'isDisposable'    => ! empty( $result['isDisposable'] ),
            'isFreeEmail'     => ! empty( $result['isFreeEmail'] ),
            'mxValid'         => isset( $result['mxValid'] ) ? $result['mxValid'] : null,
            'reputationScore' => isset( $result['reputationScore'] ) ? $result['reputationScore'] : null,
            'riskLevel'       => isset( $result['riskLevel'] ) ? $result['riskLevel'] : null,
            'tags'            => isset( $result['tags'] ) ? $result['tags'] : array(),
            'decision'        => $decision,
        ) );
    }

    public static function render_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        $active_tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'general';
        ?>
        <div class="wrap leadcop-wrap">
            <div class="leadcop-header">
                <div class="leadcop-logo">
                    <span class="dashicons dashicons-shield-alt"></span>
                    <h1>LeadCop Email Validator</h1>
                </div>
                <p class="leadcop-tagline"><?php esc_html_e( 'Block disposable and unwanted email addresses from your WordPress forms.', 'leadcop' ); ?></p>
            </div>

            <nav class="leadcop-tabs nav-tab-wrapper">
                <?php
                $tabs = array(
                    'general'      => __( 'General', 'leadcop' ),
                    'rules'        => __( 'Validation Rules', 'leadcop' ),
                    'integrations' => __( 'Form Integrations', 'leadcop' ),
                );
                foreach ( $tabs as $slug => $label ) {
                    $class = ( $active_tab === $slug ) ? 'nav-tab nav-tab-active' : 'nav-tab';
                    $url   = add_query_arg( array( 'page' => 'leadcop', 'tab' => $slug ), admin_url( 'admin.php' ) );
                    printf( '<a href="%s" class="%s">%s</a>', esc_url( $url ), esc_attr( $class ), esc_html( $label ) );
                }
                ?>
            </nav>

            <form method="post" action="options.php">
                <?php settings_fields( 'leadcop_settings' ); ?>

                <?php if ( $active_tab === 'general' ) : ?>
                    <div class="leadcop-section">
                        <h2><?php esc_html_e( 'API Configuration', 'leadcop' ); ?></h2>
                        <table class="form-table" role="presentation">
                            <tr>
                                <th scope="row"><label for="leadcop_api_key"><?php esc_html_e( 'API Key', 'leadcop' ); ?></label></th>
                                <td>
                                    <input type="password" id="leadcop_api_key" name="leadcop_api_key"
                                           value="<?php echo esc_attr( get_option( 'leadcop_api_key', '' ) ); ?>"
                                           class="regular-text" autocomplete="new-password" />
                                    <p class="description">
                                        <?php printf(
                                            /* translators: %s: link to LeadCop dashboard */
                                            esc_html__( 'Get your API key from the %s.', 'leadcop' ),
                                            '<a href="https://leadcop.io/dashboard" target="_blank">' . esc_html__( 'LeadCop dashboard', 'leadcop' ) . '</a>'
                                        ); ?>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row"><label for="leadcop_api_url"><?php esc_html_e( 'API URL', 'leadcop' ); ?></label></th>
                                <td>
                                    <input type="url" id="leadcop_api_url" name="leadcop_api_url"
                                           value="<?php echo esc_attr( get_option( 'leadcop_api_url', 'https://leadcop.io' ) ); ?>"
                                           class="regular-text" />
                                    <p class="description"><?php esc_html_e( 'Leave as default unless you are self-hosting LeadCop.', 'leadcop' ); ?></p>
                                </td>
                            </tr>
                        </table>

                        <h2 class="leadcop-mt"><?php esc_html_e( 'Test Email Verification', 'leadcop' ); ?></h2>
                        <div class="leadcop-test-tool">
                            <div class="leadcop-test-row">
                                <input type="email" id="leadcop-test-email" placeholder="<?php esc_attr_e( 'test@example.com', 'leadcop' ); ?>" class="regular-text" />
                                <button type="button" id="leadcop-test-btn" class="button button-primary"><?php esc_html_e( 'Check Email', 'leadcop' ); ?></button>
                            </div>
                            <div id="leadcop-test-result" class="leadcop-test-result" style="display:none;"></div>
                        </div>

                        <?php submit_button( __( 'Save Settings', 'leadcop' ) ); ?>
                    </div>

                <?php elseif ( $active_tab === 'rules' ) : ?>
                    <div class="leadcop-section">
                        <h2><?php esc_html_e( 'Validation Rules', 'leadcop' ); ?></h2>
                        <p class="description leadcop-desc"><?php esc_html_e( 'Configure how the plugin responds to each type of email address.', 'leadcop' ); ?></p>

                        <table class="form-table" role="presentation">

                            <!-- Disposable emails -->
                            <tr>
                                <th scope="row"><?php esc_html_e( 'Disposable Emails', 'leadcop' ); ?></th>
                                <td>
                                    <label class="leadcop-toggle">
                                        <input type="hidden" name="leadcop_block_disposable" value="0" />
                                        <input type="checkbox" name="leadcop_block_disposable" value="1" <?php checked( get_option( 'leadcop_block_disposable', '1' ), '1' ); ?> />
                                        <?php esc_html_e( 'Block disposable / burner email addresses', 'leadcop' ); ?>
                                    </label>
                                    <p class="description"><?php esc_html_e( 'Recommended. This is the primary function of the plugin.', 'leadcop' ); ?></p>
                                    <div class="leadcop-msg-field">
                                        <label for="leadcop_msg_disposable"><?php esc_html_e( 'Error message shown to the visitor:', 'leadcop' ); ?></label>
                                        <input type="text" id="leadcop_msg_disposable" name="leadcop_msg_disposable"
                                               value="<?php echo esc_attr( get_option( 'leadcop_msg_disposable', __( 'Disposable email addresses are not allowed.', 'leadcop' ) ) ); ?>"
                                               class="large-text" />
                                    </div>
                                </td>
                            </tr>

                            <!-- Free email providers -->
                            <tr>
                                <th scope="row"><?php esc_html_e( 'Free Email Providers', 'leadcop' ); ?></th>
                                <td>
                                    <select name="leadcop_free_email_action">
                                        <?php
                                        $current_free = get_option( 'leadcop_free_email_action', 'off' );
                                        $options = array(
                                            'off'   => __( 'Off — allow all free providers', 'leadcop' ),
                                            'warn'  => __( 'Warn — show a warning but allow submission', 'leadcop' ),
                                            'block' => __( 'Block — reject free provider emails', 'leadcop' ),
                                        );
                                        foreach ( $options as $val => $label ) {
                                            printf( '<option value="%s" %s>%s</option>', esc_attr( $val ), selected( $current_free, $val, false ), esc_html( $label ) );
                                        }
                                        ?>
                                    </select>
                                    <p class="description"><?php esc_html_e( 'Gmail, Yahoo, Outlook, and other major free providers.', 'leadcop' ); ?></p>
                                    <div class="leadcop-msg-field">
                                        <label for="leadcop_msg_free_email"><?php esc_html_e( 'Message shown to the visitor:', 'leadcop' ); ?></label>
                                        <input type="text" id="leadcop_msg_free_email" name="leadcop_msg_free_email"
                                               value="<?php echo esc_attr( get_option( 'leadcop_msg_free_email', __( 'Free email providers are not accepted. Please use a work email.', 'leadcop' ) ) ); ?>"
                                               class="large-text" />
                                    </div>
                                </td>
                            </tr>

                            <!-- MX record check -->
                            <tr>
                                <th scope="row"><?php esc_html_e( 'No MX Records', 'leadcop' ); ?></th>
                                <td>
                                    <select name="leadcop_mx_action">
                                        <?php
                                        $current_mx = get_option( 'leadcop_mx_action', 'off' );
                                        $options = array(
                                            'off'   => __( 'Off — ignore MX status', 'leadcop' ),
                                            'warn'  => __( 'Warn — show a warning but allow submission', 'leadcop' ),
                                            'block' => __( 'Block — reject emails from domains with no MX records', 'leadcop' ),
                                        );
                                        foreach ( $options as $val => $label ) {
                                            printf( '<option value="%s" %s>%s</option>', esc_attr( $val ), selected( $current_mx, $val, false ), esc_html( $label ) );
                                        }
                                        ?>
                                    </select>
                                    <p class="description"><?php esc_html_e( 'Domains with no MX records cannot receive email. Requires MX detection on your LeadCop plan.', 'leadcop' ); ?></p>
                                    <div class="leadcop-msg-field">
                                        <label for="leadcop_msg_mx"><?php esc_html_e( 'Message shown to the visitor:', 'leadcop' ); ?></label>
                                        <input type="text" id="leadcop_msg_mx" name="leadcop_msg_mx"
                                               value="<?php echo esc_attr( get_option( 'leadcop_msg_mx', __( 'This email domain has no mail server — messages may not be delivered.', 'leadcop' ) ) ); ?>"
                                               class="large-text" />
                                    </div>
                                </td>
                            </tr>

                        </table>
                        <?php submit_button( __( 'Save Rules', 'leadcop' ) ); ?>
                    </div>

                <?php elseif ( $active_tab === 'integrations' ) : ?>
                    <div class="leadcop-section">
                        <h2><?php esc_html_e( 'Form Integrations', 'leadcop' ); ?></h2>
                        <p class="description leadcop-desc"><?php esc_html_e( 'Choose which form systems LeadCop should validate email addresses in. Third-party plugins only appear when they are installed and active.', 'leadcop' ); ?></p>

                        <table class="form-table" role="presentation">

                            <tr>
                                <th scope="row"><?php esc_html_e( 'WordPress Core', 'leadcop' ); ?></th>
                                <td>
                                    <label class="leadcop-toggle">
                                        <input type="hidden" name="leadcop_hook_wp_register" value="0" />
                                        <input type="checkbox" name="leadcop_hook_wp_register" value="1" <?php checked( get_option( 'leadcop_hook_wp_register', '1' ), '1' ); ?> />
                                        <?php esc_html_e( 'User registration form', 'leadcop' ); ?>
                                    </label><br>
                                    <label class="leadcop-toggle">
                                        <input type="hidden" name="leadcop_hook_wp_comment" value="0" />
                                        <input type="checkbox" name="leadcop_hook_wp_comment" value="1" <?php checked( get_option( 'leadcop_hook_wp_comment', '1' ), '1' ); ?> />
                                        <?php esc_html_e( 'Comment submission form', 'leadcop' ); ?>
                                    </label>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">WooCommerce</th>
                                <td>
                                    <?php if ( ! class_exists( 'WooCommerce' ) ) : ?>
                                        <p class="leadcop-not-installed"><?php esc_html_e( 'WooCommerce is not installed or active.', 'leadcop' ); ?></p>
                                    <?php else : ?>
                                        <label class="leadcop-toggle">
                                            <input type="hidden" name="leadcop_hook_woo_checkout" value="0" />
                                            <input type="checkbox" name="leadcop_hook_woo_checkout" value="1" <?php checked( get_option( 'leadcop_hook_woo_checkout', '1' ), '1' ); ?> />
                                            <?php esc_html_e( 'Checkout billing email', 'leadcop' ); ?>
                                        </label><br>
                                        <label class="leadcop-toggle">
                                            <input type="hidden" name="leadcop_hook_woo_account" value="0" />
                                            <input type="checkbox" name="leadcop_hook_woo_account" value="1" <?php checked( get_option( 'leadcop_hook_woo_account', '1' ), '1' ); ?> />
                                            <?php esc_html_e( 'My Account registration form', 'leadcop' ); ?>
                                        </label>
                                    <?php endif; ?>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">Contact Form 7</th>
                                <td>
                                    <?php if ( ! class_exists( 'WPCF7' ) ) : ?>
                                        <p class="leadcop-not-installed"><?php esc_html_e( 'Contact Form 7 is not installed or active.', 'leadcop' ); ?></p>
                                    <?php else : ?>
                                        <label class="leadcop-toggle">
                                            <input type="hidden" name="leadcop_hook_cf7" value="0" />
                                            <input type="checkbox" name="leadcop_hook_cf7" value="1" <?php checked( get_option( 'leadcop_hook_cf7', '1' ), '1' ); ?> />
                                            <?php esc_html_e( 'Validate email fields in all CF7 forms', 'leadcop' ); ?>
                                        </label>
                                    <?php endif; ?>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">WPForms</th>
                                <td>
                                    <?php if ( ! function_exists( 'wpforms' ) ) : ?>
                                        <p class="leadcop-not-installed"><?php esc_html_e( 'WPForms is not installed or active.', 'leadcop' ); ?></p>
                                    <?php else : ?>
                                        <label class="leadcop-toggle">
                                            <input type="hidden" name="leadcop_hook_wpforms" value="0" />
                                            <input type="checkbox" name="leadcop_hook_wpforms" value="1" <?php checked( get_option( 'leadcop_hook_wpforms', '1' ), '1' ); ?> />
                                            <?php esc_html_e( 'Validate email fields in all WPForms forms', 'leadcop' ); ?>
                                        </label>
                                    <?php endif; ?>
                                </td>
                            </tr>

                            <tr>
                                <th scope="row">Gravity Forms</th>
                                <td>
                                    <?php if ( ! class_exists( 'GFCommon' ) ) : ?>
                                        <p class="leadcop-not-installed"><?php esc_html_e( 'Gravity Forms is not installed or active.', 'leadcop' ); ?></p>
                                    <?php else : ?>
                                        <label class="leadcop-toggle">
                                            <input type="hidden" name="leadcop_hook_gravityforms" value="0" />
                                            <input type="checkbox" name="leadcop_hook_gravityforms" value="1" <?php checked( get_option( 'leadcop_hook_gravityforms', '1' ), '1' ); ?> />
                                            <?php esc_html_e( 'Validate email fields in all Gravity Forms', 'leadcop' ); ?>
                                        </label>
                                    <?php endif; ?>
                                </td>
                            </tr>

                        </table>
                        <?php submit_button( __( 'Save Integrations', 'leadcop' ) ); ?>
                    </div>

                <?php endif; ?>
            </form>
        </div>
        <?php
    }
}
