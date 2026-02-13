/**
 * ArtistRolesSection Component
 *
 * Manages artist roles array in the figure form.
 * Allows adding/removing artists with role type selection (Sculptor, Painter, Illustrator).
 * Uses react-hook-form's useFieldArray for array management.
 */

import React from 'react';
import {
  Box,
  Button,
  FormControl,
  HStack,
  IconButton,
  Input,
  Select,
  Text,
  VStack,
  Badge,
  useColorModeValue,
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
          leftIcon={<FaPlus />}
          size="sm"
          variant="outline"
          colorScheme="teal"
          onClick={handleAddArtist}
          aria-label="Add artist"
        >
          Add Artist
        </Button>
      </HStack>

      {fields.length === 0 ? (
        <Text color="gray.500" fontSize="sm" fontStyle="italic">
          No artists added. Click &quot;Add Artist&quot; to assign artist roles.
        </Text>
      ) : (
        <VStack spacing={3} align="stretch">
          {fields.map((field, index) => (
            <HStack key={field.id} spacing={3} p={3} borderWidth="1px" borderRadius="md" bg={rowBgColor}>
              {/* Artist Name Input */}
              <FormControl flex="2">
                <Input
                  {...register(`artistRoles.${index}.artistName` as const)}
                  placeholder="Artist name"
                  defaultValue={field.artistName}
                />
              </FormControl>

              {/* Role Type Select */}
              <FormControl flex="1">
                <Select
                  {...register(`artistRoles.${index}.roleId` as const)}
                  aria-label="Role"
                  defaultValue={
                    // Use roleId if set, otherwise find by roleName (handles race condition)
                    field.roleId ||
                    artistRoleTypes.find(rt => rt.name.toLowerCase() === field.roleName?.toLowerCase())?._id ||
                    ''
                  }
                  onChange={(e) => {
                    const selectedRole = artistRoleTypes.find((rt) => rt._id === e.target.value);
                    if (selectedRole) {
                      const input = document.querySelector(
                        `input[name="artistRoles.${index}.roleName"]`
                      ) as HTMLInputElement;
                      if (input) input.value = selectedRole.name;
                    }
                  }}
                >
                  {artistRoleTypes.map((rt) => (
                    <option key={rt._id} value={rt._id}>
                      {rt.name}
                    </option>
                  ))}
                </Select>
                <input
                  type="hidden"
                  {...register(`artistRoles.${index}.roleName` as const)}
                  defaultValue={field.roleName}
                />
              </FormControl>

              {/* Role Badge (visual indicator) */}
              {field.roleName && (
                <Badge colorScheme="teal" alignSelf="center">
                  {field.roleName}
                </Badge>
              )}

              {/* Remove Button */}
              <IconButton
                aria-label="Remove artist"
                icon={<FaTrash />}
                size="sm"
                colorScheme="red"
                variant="ghost"
                onClick={() => remove(index)}
              />
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default ArtistRolesSection;
