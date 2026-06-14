import React, { useState, useEffect, useCallback } from 'react';
import {
  Steps,
  Checkbox,
  Button,
  Text,
  VStack,
  Spinner,
  Center,
  Alert,
  Dialog,
  Portal,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from 'react-query';
import { getLists, getListsByItem, addItemsToList, removeItemsFromList } from '../api';
import { MfcList } from '../types';

interface ListMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The MFC ID of the figure to manage list membership for */
  figureMfcId: number;
  figureName: string;
}

const ListMembershipModal: React.FC<ListMembershipModalProps> = ({
  isOpen,
  onClose,
  figureMfcId,
  figureName,
}) => {
  const queryClient = useQueryClient();
  const [checkedListIds, setCheckedListIds] = useState<Set<string>>(new Set());
  const [originalListIds, setOriginalListIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all user lists
  const { data: listsData, isLoading: listsLoading } = useQuery(
    ['lists', 'all'],
    () => getLists({ limit: 200, sortBy: 'name', sortOrder: 'asc' }),
    { enabled: isOpen }
  );

  // Fetch lists that contain this figure
  const { data: memberLists, isLoading: memberLoading } = useQuery(
    ['listsByItem', figureMfcId],
    () => getListsByItem(figureMfcId),
    { enabled: isOpen && !!figureMfcId }
  );

  // Initialize checkbox state when data loads
  useEffect(() => {
    if (memberLists) {
      const memberIds = new Set(memberLists.map((l) => l._id));
      setCheckedListIds(memberIds);
      setOriginalListIds(memberIds);
    }
  }, [memberLists]);

  const handleToggle = useCallback((listId: string) => {
    setCheckedListIds((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) {
        next.delete(listId);
      } else {
        next.add(listId);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Compute adds and removes
      const toAdd = Array.from(checkedListIds).filter((id) => !originalListIds.has(id));
      const toRemove = Array.from(originalListIds).filter((id) => !checkedListIds.has(id));

      // Execute all mutations
      const promises: Promise<any>[] = [];
      for (const listId of toAdd) {
        promises.push(addItemsToList(listId, [figureMfcId]));
      }
      for (const listId of toRemove) {
        promises.push(removeItemsFromList(listId, [figureMfcId]));
      }
      await Promise.all(promises);

      // Invalidate relevant queries
      queryClient.invalidateQueries('lists');
      queryClient.invalidateQueries(['listsByItem', figureMfcId]);

      onClose();
    } catch {
      // Error is shown via the mutation's error handling
    } finally {
      setIsSaving(false);
    }
  }, [checkedListIds, originalListIds, figureMfcId, queryClient, onClose]);

  const isLoading = listsLoading || memberLoading;
  const lists: MfcList[] = listsData?.data || [];
  const hasChanges = (() => {
    if (checkedListIds.size !== originalListIds.size) return true;
    let changed = false;
    checkedListIds.forEach((id) => {
      if (!originalListIds.has(id)) changed = true;
    });
    return changed;
  })();

  return (
    <Dialog.Root open={isOpen} size='md' scrollBehavior="inside" onOpenChange={e => {
      if (!e.open) {
        onClose();
      }
    }}>
      <Portal>

        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>Manage Lists</Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body>
              <Text fontSize="sm" color="gray.500" mb={4}>
                Select which lists should include <strong>{figureName}</strong>
              </Text>

              {isLoading && (
                <Center py={8}>
                  <Spinner data-testid="membership-spinner" />
                </Center>
              )}

              {!isLoading && lists.length === 0 && (
                <Alert.Root status="info" borderRadius="md">
                  <Alert.Indicator />
                  No lists found. Create a list first, then come back to add figures.
                </Alert.Root>
              )}

              {!isLoading && lists.length > 0 && (
                <VStack align="stretch" gap={2}>
                  {lists.map((list) => (
                    <Checkbox.Root
                      key={list._id}
                      onCheckedChange={() => handleToggle(list._id)}
                      data-testid={`list-checkbox-${list._id}`}
                      checked={checkedListIds.has(list._id)}
                    ><Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Label>
                        {list.name}
                        {list.itemCount > 0 && (
                          <Text as="span" fontSize="xs" color="gray.500" ml={2}>
                            ({list.itemCount} items)
                          </Text>
                        )}
                      </Checkbox.Label></Checkbox.Root>
                  ))}
                </VStack>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorPalette="brand"
                onClick={handleSave}
                loading={isSaving}
                disabled={!hasChanges}
                data-testid="membership-save-btn"
              >
                Save
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>

      </Portal>
    </Dialog.Root>
  );
};

export default ListMembershipModal;
