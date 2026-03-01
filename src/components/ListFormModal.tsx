import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  FormErrorMessage,
} from '@chakra-ui/react';
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isEdit ? 'Edit List' : 'Create List'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isInvalid={!!nameError} mb={4} isRequired>
            <FormLabel>Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="List name"
              maxLength={MFC_LIST_LIMITS.NAME_MAX}
              data-testid="list-name-input"
            />
            {nameError && <FormErrorMessage>{nameError}</FormErrorMessage>}
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Teaser</FormLabel>
            <Input
              value={teaser}
              onChange={(e) => setTeaser(e.target.value)}
              placeholder="Short description"
              maxLength={MFC_LIST_LIMITS.TEASER_MAX}
              data-testid="list-teaser-input"
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Description</FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description (optional)"
              rows={4}
              data-testid="list-description-input"
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Privacy</FormLabel>
            <Select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as ListPrivacy)}
              data-testid="list-privacy-select"
            >
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </Select>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleSubmit}
            isLoading={isLoading}
            data-testid="list-form-submit"
          >
            {isEdit ? 'Save Changes' : 'Create List'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ListFormModal;
