<?php
/**
 * Désinstallation propre : on supprime uniquement les options du plugin.
 * Les fiches (CPT) NE SONT PAS supprimées par défaut (sécurité).
 */
if (!defined('WP_UNINSTALL_PLUGIN')) exit;
delete_option('taganimal_fiches_options');
