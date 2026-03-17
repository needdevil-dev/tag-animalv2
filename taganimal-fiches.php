<?php
/**
 * Plugin Name: TagAnimal – Fiches
 * Description: Base solide pour TagAnimal : scan QR -> activation -> fiche publique /nfc/{slug}. Admin: Fiches, Outils, Réglages.
 * Author: TagAnimal
 * Version: 2.0.30
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Text Domain: taganimal-fiches
 */

if (!defined('ABSPATH')) exit;



// ======= CONSTANTES =======
define('TAGANIMAL_FICHES_VERSION', '2.0.30');
define('TAGANIMAL_FICHES_FILE', __FILE__);
define('TAGANIMAL_FICHES_PATH', plugin_dir_path(__FILE__));
define('TAGANIMAL_FICHES_URL',  plugin_dir_url(__FILE__));
define('TAGANIMAL_FICHES_CAP',  'manage_ta_fiches');

// ======= BUILD (cache-busting global à incrémenter à chaque déploiement) =======
if (!defined('TAGANIMAL_BUILD')) {
    define('TAGANIMAL_BUILD', '2025-11-13-1'); // ← change ce string à chaque push
}


// (Option) Token privé pour l’API usine
if (!defined('TAGANIMAL_API_TOKEN')) {
    define('TAGANIMAL_API_TOKEN', 'CHANGE-MOI-EN-CLE-SECRETE-LONGUE');
}

// Secret HMAC pour liens e-mails (unsubscribe / prefs)
if (!defined('TAGANIMAL_EMAIL_SECRET')) {
    define('TAGANIMAL_EMAIL_SECRET', 'CHANGE-MOI-EN-CLE-EMAIL-TRES-LONGUE');
}

if (!function_exists('ta_heart_now')) {
    /**
     * Horloge TagAnimal Heart (admin/debug uniquement).
     * Override possible via ?ta_heart_now=YYYY-MM-DD ou option ta_heart_now_override.
     */
    function ta_heart_now(): string
    {
        $today = current_time('Y-m-d');
        $override = '';

        if (is_user_logged_in() && current_user_can('manage_options')) {
            $override = isset($_GET['ta_heart_now']) ? sanitize_text_field((string) $_GET['ta_heart_now']) : '';
            if ($override === '') {
                $override = (string) get_option('ta_heart_now_override');
            }
        }

        if ($override !== '') {
            if (class_exists(\TagAnimal\Fiches\Domain\FicheService::class)) {
                $override = \TagAnimal\Fiches\Domain\FicheService::normalize_date($override);
            } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $override)) {
                $override = '';
            }
        }

        return $override !== '' ? $override : $today;
    }
}



// ======= AUTOLOADER PSR-4 SIMPLE =======
spl_autoload_register(function ($class) {
    $prefix   = 'TagAnimal\\Fiches\\';
    $base_dir = TAGANIMAL_FICHES_PATH . 'src/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) require $file;
});




// ======= USE =======
use TagAnimal\Fiches\Core\Plugin;
use TagAnimal\Fiches\Support\EmailService;
use TagAnimal\Fiches\Support\ActivationMailer;
use TagAnimal\Fiches\Support\ScanMailer;
use TagAnimal\Fiches\Support\ConsentService;
use TagAnimal\Fiches\Support\Consentement\ContactChannelsConsentService;
use TagAnimal\Fiches\Support\ReminderService;
use TagAnimal\Fiches\Support\MailLogger;
use TagAnimal\Fiches\Tools\ReminderTools;
use TagAnimal\Fiches\Support\ReminderDebug;
use TagAnimal\Fiches\Frontend\EditPhotoAjax;
use TagAnimal\Fiches\Admin\QrSheetPage;
use TagAnimal\Fiches\Admin\EmailsPage;
use TagAnimal\Fiches\Frontend\ActivationController;
use TagAnimal\Fiches\Frontend\PublicEditController;
use TagAnimal\Fiches\Frontend\EmailPrefsController;
use TagAnimal\Fiches\Admin\EmailsNewsletterPage;
use TagAnimal\Fiches\Domain\Comportement\BehaviorProfileBuilder;


require_once TAGANIMAL_FICHES_PATH . 'src/Frontend/ContactChannelsAjax.php';


// Forcer la bonne version de PublicEditController si besoin
$pec_path = TAGANIMAL_FICHES_PATH . 'src/Frontend/PublicEditController.php';
if (is_readable($pec_path)) {
    require_once $pec_path;
}

// ======= Mimes supplémentaires =======
add_filter('upload_mimes', static function(array $m): array {
    $m['heic'] = 'image/heic';
    $m['heif'] = 'image/heif';
    return $m;
});





/**
 * ======= TEMPLATES E-MAIL (GLOBAL + VACCIN) =======
 *
 * - Enveloppe HTML globale pour tous les e-mails
 * - Templates vaccin par défaut (fallback code)
 *
 * Chargé volontairement à plugins_loaded :
 * - EmailService est disponible
 * - Autoload PSR-4 actif
 */
add_action('plugins_loaded', static function () {




    /* ==================================================
     * 2) TEMPLATES VACCIN — DEFAULTS CODE
     * ================================================== */

    if (
        class_exists(\TagAnimal\Fiches\Support\Mail\VaccineMailTemplates::class)
    ) {
        add_filter(
            'taganimal_email_default_templates',
            static function (array $templates): array {
                return array_merge(
                    $templates,
                    \TagAnimal\Fiches\Support\Mail\VaccineMailTemplates::get_defaults()
                );
            }
        );
    }
});





// ======= HOOKS ACTIVATION / DESACTIVATION =======
register_activation_hook(__FILE__, static function () {
    if (class_exists(Plugin::class) && method_exists(Plugin::class, 'activate')) {
        Plugin::activate();
    }
    if (class_exists(\TagAnimal\Fiches\Support\MailLogger::class)) {
        \TagAnimal\Fiches\Support\MailLogger::create_table();
    }
});


register_deactivation_hook(__FILE__, static function () {
    if (class_exists(Plugin::class) && method_exists(Plugin::class, 'deactivate')) {
        Plugin::deactivate();
    }
    if (function_exists('wp_clear_scheduled_hook')) {
        wp_clear_scheduled_hook('taganimal_daily_reminders');
        wp_clear_scheduled_hook('taganimal_reminders_tick');

    }
});

// ======= BOOT =======
// admin-post passe par 'init' (et non 'admin_init')

add_action('plugins_loaded', static function () {

    // Text domain
    load_plugin_textdomain(
        'taganimal-fiches',
        false,
        dirname(plugin_basename(__FILE__)) . '/languages'
    );
    
    // Outils → Planche QR (16,8 mm, modèle Patte)
if (class_exists(QrSheetPage::class) && method_exists(QrSheetPage::class, 'register')) {
    QrSheetPage::register();
}


    // Core
    if (class_exists(Plugin::class) && method_exists(Plugin::class, 'register')) {
        (new Plugin())->register();
    }
    if (class_exists(EditPhotoAjax::class) && method_exists(EditPhotoAjax::class, 'register')) {
    EditPhotoAjax::register();
}


    // Journal des e-mails : capture des erreurs wp_mail_failed
if (class_exists(\TagAnimal\Fiches\Support\MailLogger::class) && method_exists(\TagAnimal\Fiches\Support\MailLogger::class, 'register')) {
    \TagAnimal\Fiches\Support\MailLogger::register();
}

    if (class_exists(ConsentService::class) && method_exists(ConsentService::class, 'register')) {
        ConsentService::register();
    }
    if (class_exists(ScanMailer::class) && method_exists(ScanMailer::class, 'register')) {
        ScanMailer::register();
    }
    
    // Services e-mail & consentement
if (class_exists(EmailService::class) && method_exists(EmailService::class, 'register')) {
    EmailService::register();
}

// Page d’admin "E-mails" (modèles, test, journal)
if (class_exists(EmailsPage::class) && method_exists(EmailsPage::class, 'register')) {
    EmailsPage::register();
}

    
    if (class_exists(ReminderService::class) && method_exists(ReminderService::class, 'register')) {
        ReminderService::register();
    }
    
    // ======= Vaccine Reminder Runner (vaccin uniquement) =======
    if (class_exists(ReminderDebug::class) && method_exists(ReminderDebug::class, 'register')) {
        ReminderDebug::register();
    }
        // ======= Vaccine Reminder Runner (vaccin uniquement) =======
    if (class_exists(ReminderDebug::class) && method_exists(ReminderDebug::class, 'register')) {
        ReminderDebug::register();
    }
    
    // ======= Vaccine Reminder Emails (J-30/J-7/J0/J+3) =======   ← AJOUTER ICI
    if (class_exists(\TagAnimal\Fiches\Support\Cron\VaccineReminderCron::class)) {
        \TagAnimal\Fiches\Support\Cron\VaccineReminderCron::register();
    }
    if (class_exists(\TagAnimal\Fiches\Admin\VaccineReminderAdminController::class)) {
        \TagAnimal\Fiches\Admin\VaccineReminderAdminController::register();
    }
    
    
    if (class_exists(ActivationMailer::class) && method_exists(ActivationMailer::class, 'register')) {
        ActivationMailer::register();
    }

    // Front
    if (class_exists(ActivationController::class) && method_exists(ActivationController::class, 'register')) {
        ActivationController::register();
    }
    if (class_exists(EmailPrefsController::class) && method_exists(EmailPrefsController::class, 'register')) {
        EmailPrefsController::register();
    }

    if (class_exists(PublicEditController::class)) {
        if (method_exists(PublicEditController::class, 'register')) {
            PublicEditController::register();
        } elseif (method_exists(PublicEditController::class, 'handle_post')) {
            add_action('template_redirect', [PublicEditController::class, 'handle_post'], 1);
        }
    }

    add_action('admin_init', static function () {
    if (!class_exists(\TagAnimal\Fiches\Support\MailLogger::class)) return;

    global $wpdb;
    $table = $wpdb->prefix . 'ta_mail_log';
    $exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table));

    if ($exists !== $table) {
        \TagAnimal\Fiches\Support\MailLogger::create_table();
    }
    

    
    
    
});

});
