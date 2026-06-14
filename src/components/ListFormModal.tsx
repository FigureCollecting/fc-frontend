import React, { useState, useEffect } from 'react';
import { Steps, Input, Textarea, NativeSelect, Button, Field, Dialog, Portal } from '@chakra-ui/react';
import { MfcList, MfcListFormData, MFC_LIST_LIMITS, ListPrivacy } from '../types';

interface ListFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MfcListFormData) => void;
  isLoading?: boolean;
  /** Pass an existing list to edit; omit for create mode */
  list?: MfcList;
}

const ListFormModal: React.FC<ListFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  list,
}) => {
  const [name, setName] = useState('');
  const [teaser, setTeaser] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<ListPrivacy>('private');
  const [nameError, setNameError] = useState('');

  const isEdit = !!list;

  // Reset form when modal opens or list changes
  useEffect(() => {
    if (isOpen) {
      if (list) {
        setName(list.name);
        setTeaser(list.teaser || '');
        setDescription(list.description || '');
        setPrivacy(list.privacy);
      } else {
        setName('');
        setTeaser('');
        setDescription('');
        setPrivacy('private');
      }
      setNameError('');
    }
  }, [isOpen, list]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Name is required');
      return;
    }
    if (trimmedName.length > MFC_LIST_LIMITS.NAME_MAX) {
      setNameError(`Name must be ${MFC_LIST_LIMITS.NAME_MAX} characters or less`);
      return;
    }
    setNameError('');

    const data: MfcListFormData = {
      name: trimmedName,
      privacy,
      ...(teaser.trim() && { teaser: teaser.trim() }),
      ...(description.trim() && { description: description.trim() }),
    };

    onSubmit(data);
  };

  return (
    <Dialog.Root open={isOpen} size='lg' onOpenChange={e => {
      if (!e.open) {
        onClose();
      }
    }}>
      <Portal>

        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>{isEdit ? 'Edit List' : 'Create List'}</Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body>
              <Field.Root invalid={!!nameError} mb={4} required>
                <Field.Label>Name</Field.Label>
                <Input
                  value={name}
                  onValueChange={(e) => setName(e.target.value)}
                  placeholder="List name"
                  maxLength={MFC_LIST_LIMITS.NAME_MAX}
                  data-testid="list-name-input"
                />
                {nameError && <Field.ErrorText>{nameError}</Field.ErrorText>}
              </Field.Root>

              <Field.Root mb={4}>
                <Field.Label>Teaser</Field.Label>
                <Input
                  value={teaser}
                  onValueChange={(e) => setTeaser(e.target.value)}
                  placeholder="Short description"
                  maxLength={MFC_LIST_LIMITS.TEASER_MAX}
                  data-testid="list-teaser-input"
                />
              </Field.Root>

              <Field.Root mb={4}>
                <Field.Label>Description</Field.Label>
                <Textarea
                  value={description}
                  onValueChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description (optional)"
                  rows={4}
                  data-testid="list-description-input"
                />
              </Field.Root>

              <Field.Root mb={4}>
                <Field.Label>Privacy</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={privacy}
                    onValueChange={(e) => setPrivacy(e.target.value as ListPrivacy)}
                    data-testid="list-privacy-select">
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorPalette="brand"
                onClick={handleSubmit}
                loading={isLoading}
                data-testid="list-form-submit"
              >
                {isEdit ? 'Save Changes' : 'Create List'}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>

      </Portal>
    </Dialog.Root>
  );
};

export default ListFormModal;
