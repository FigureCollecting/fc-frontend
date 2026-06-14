/**
 * ArtistRolesSection Component
 *
 * Manages artist roles array in the figure form.
 * Allows adding/removing artists with role type selection (Sculptor, Painter, Illustrator).
 * Uses react-hook-form's useFieldArray for array management.
 */

import React from 'react';
import { useColorModeValue } from "../ui/color-mode";
import {
  Steps,
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Text,
  VStack,
  Badge,
  Field,
} from '@chakra-ui/react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { useLookupData } from '../../hooks/useLookupData';
import { FigureFormData, IArtistRoleFormData } from '../../types';

const ArtistRolesSection: React.FC = () => {
  const { control, register } = useFormContext<FigureFormData>();
  const { roleTypes } = useLookupData();

  // Color mode support
  const rowBgColor = useColorModeValue('gray.50', 'gray.700');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'artistRoles',
  });

  // Filter to only artist-type roles
  const artistRoleTypes = roleTypes.filter((rt) => rt.kind === 'artist');

  const handleAddArtist = () => {
    const defaultRoleType = artistRoleTypes.find((rt) => rt.name === 'Sculptor') || artistRoleTypes[0];
    append({
      artistId: '',
      artistName: '',
      roleId: defaultRoleType?._id || '',
      roleName: defaultRoleType?.name || '',
    } as IArtistRoleFormData);
  };

  return (
    <Box>
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="semibold" fontSize="md">
          Artists
        </Text>
        <Button
          size="sm"
          variant="outline"
          colorPalette="teal"
          onClick={handleAddArtist}
          aria-label="Add artist"><FaPlus />Add Artist
                  </Button>
      </HStack>
      {fields.length === 0 ? (
        <Text color="gray.500" fontSize="sm" fontStyle="italic">
          No artists added. Click &quot;Add Artist&quot; to assign artist roles.
        </Text>
      ) : (
        <VStack gap={3} align="stretch">
          {fields.map((field, index) => (
            <HStack key={field.id} gap={3} p={3} borderWidth="1px" borderRadius="md" bg={rowBgColor}>
              {/* Artist Name Input */}
              <Field.Root flex="2">
                <Input
                  {...register(`artistRoles.${index}.artistName` as const)}
                  placeholder="Artist name"
                  defaultValue={field.artistName}
                />
              </Field.Root>

              {/* Role Type Select */}
              <Field.Root flex="1">
                <NativeSelect.Root>
                  <NativeSelect.Field
                    {...register(`artistRoles.${index}.roleId` as const, {
                      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                        const selectedRole = artistRoleTypes.find((rt) => rt._id === e.target.value);
                        if (selectedRole) {
                          const input = document.querySelector(
                            `input[name="artistRoles.${index}.roleName"]`
                          ) as HTMLInputElement;
                          if (input) input.value = selectedRole.name;
                        }
                      },
                    })}
                    aria-label="Role"
                    defaultValue={
                      // Use roleId if set, otherwise find by roleName (handles race condition)
                      field.roleId ||
                      artistRoleTypes.find(rt => rt.name.toLowerCase() === field.roleName?.toLowerCase())?._id ||
                      ''
                    }>
                    {artistRoleTypes.map((rt) => (
                      <option key={rt._id} value={rt._id}>
                        {rt.name}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
                <input
                  type="hidden"
                  {...register(`artistRoles.${index}.roleName` as const)}
                  defaultValue={field.roleName}
                />
              </Field.Root>

              {/* Role Badge (visual indicator) */}
              {field.roleName && (
                <Badge colorPalette="teal" alignSelf="center">
                  {field.roleName}
                </Badge>
              )}

              {/* Remove Button */}
              <IconButton
                aria-label="Remove artist"
                size="sm"
                colorPalette="red"
                variant="ghost"
                onClick={() => remove(index)}><FaTrash /></IconButton>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default ArtistRolesSection;
