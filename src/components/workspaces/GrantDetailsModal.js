'use client';
import Modal from '@/components/ui/Modal';

/**
 * Shows the full reason for a historical contract entry grant.
 */
export default function GrantDetailsModal({ grant, open, onClose }) {
  if (!grant) return null;

  return (
    <Modal open={open} onClose={onClose} title="Reason" maxWidth="max-w-md">
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{grant.reason || '—'}</p>
    </Modal>
  );
}
