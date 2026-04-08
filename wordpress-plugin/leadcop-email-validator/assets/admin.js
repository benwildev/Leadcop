/* global jQuery, leadcopAdmin */
(function ($) {
    'use strict';

    $(function () {
        var $btn    = $('#leadcop-test-btn');
        var $input  = $('#leadcop-test-email');
        var $result = $('#leadcop-test-result');

        $btn.on('click', function () {
            var email = $.trim($input.val());
            if (!email) {
                $input.focus();
                return;
            }

            $btn.prop('disabled', true);
            $result
                .removeClass('is-ok is-warning is-error')
                .html('<span class="leadcop-spinner"></span> Checking&hellip;')
                .show();

            $.post(
                leadcopAdmin.ajaxUrl,
                {
                    action : 'leadcop_test_email',
                    nonce  : leadcopAdmin.nonce,
                    email  : email,
                },
                function (response) {
                    $btn.prop('disabled', false);

                    if (!response.success) {
                        $result
                            .addClass('is-error')
                            .html('<strong>Error:</strong> ' + escHtml(response.data.message));
                        return;
                    }

                    var d = response.data;
                    var stateClass = 'is-ok';

                    if (d.decision && d.decision.block) {
                        stateClass = 'is-error';
                    } else if (d.decision && d.decision.warn) {
                        stateClass = 'is-warning';
                    }

                    var rows = [
                        row('Disposable',       d.isDisposable ? '🚫 Yes' : '✅ No'),
                        row('Free Provider',    d.isFreeEmail  ? '⚠️ Yes' : '✅ No'),
                        row('MX Valid',         d.mxValid === null ? '—' : (d.mxValid ? '✅ Yes' : '⚠️ No')),
                        row('Reputation Score', d.reputationScore !== null ? d.reputationScore : '—'),
                        row('Risk Level',       d.riskLevel || '—'),
                    ];

                    if (d.tags && d.tags.length) {
                        rows.push(row('Tags', d.tags.join(', ')));
                    }

                    if (d.decision && d.decision.block) {
                        rows.push(row('Action', '🚫 BLOCKED — ' + escHtml(d.decision.message)));
                    } else if (d.decision && d.decision.warn) {
                        rows.push(row('Action', '⚠️ WARNING — ' + escHtml(d.decision.message)));
                    } else {
                        rows.push(row('Action', '✅ Allowed'));
                    }

                    $result.addClass(stateClass).html(rows.join(''));
                }
            ).fail(function () {
                $btn.prop('disabled', false);
                $result
                    .addClass('is-error')
                    .html('<strong>Network error.</strong> Please check your connection and try again.');
            });
        });

        $input.on('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                $btn.trigger('click');
            }
        });

        function row(label, value) {
            return '<div class="result-row"><span class="result-label">' + escHtml(label) + ':</span><span>' + value + '</span></div>';
        }

        function escHtml(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }
    });
}(jQuery));
