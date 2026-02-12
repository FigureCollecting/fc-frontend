/**
 * CompanyRolesSection Component
 *
 * Manages company roles array in the figure form.
 * Allows adding/removing companies with role type selection.
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
import { FigureFormData, ICompanyRoleFormData } from '../../types';

const CompanyRolesSection: React.FC = () => {
  const { control, register } = useFormContext<FigureFormData>();
  const { roleTypes } = useLookupData();

  // Color mode support
  const rowBgColor = useColorModeValue('gray.50', 'gray.700');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'companyRoles',
  });

  // Filter to only company-type roles
  const companyRoleTypes = roleTypes.filter((rt) => rt.kind === 'company');

  const handleAddCompany = () => {
    const defaultRoleType = companyRoleTypes.find((rt) => rt.name === 'Manufacturer') || companyRoleTypes[0];
    append({
      companyId: '',
      companyName: '',
      roleId: defaultRoleType?._id || '',
      roleName: defaultRoleType?.name || '',
    } as ICompanyRoleFormData);
  };

  return (
    <Box>
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="semibold" fontSize="md">
          Companies
        </Text>
        <Button
          leftIcon={<FaPlus />}
          size="sm"
          variant="outline"
          colorScheme="blue"
          onClick={handleAddCompany}
          aria-label="Add company"
        >
          Add Company
        </Button>
      </HStack>

      {fields.length === 0 ? (
        <Text color="gray.500" fontSize="sm" fontStyle="italic">
          No companies added. Click &quot;Add Company&quot; to assign company roles.
        </Text>
      ) : (
        <VStack spacing={3} align="stretch">
          {fields.map((field, index) => (
            <HStack key={field.id} spacing={3} p={3} borderWidth="1px" borderRadius="md" bg={rowBgColor}>
              {/* Company Name Input */}
              <FormControl flex="2">
                <Input
                  {...register(`companyRoles.${index}.companyName` as const)}
                  placeholder="Company name"
                  defaultValue={field.companyName}
                />
              </FormControl>

              {/* Role Type Select */}
              <FormControl flex="1">
                <Select
                  {...register(`companyRoles.${index}.roleId` as const)}
                  aria-label="Role"
                  defaultValue={
                    // Use roleId if set, otherwise find by roleName (handles race condition)
                    field.roleId ||
                    companyRoleTypes.find(rt => rt.name.toLowerCase() === field.roleName?.toLowerCase())?._id ||
                    ''
                  }
                  onChange={(e) => {
                    const selectedRole = companyRoleTypes.find((rt) => rt._id === e.target.value);
                    if (selectedRole) {
                      // Update roleName when roleId changes
                      const input = document.querySelector(
                        `input[name="companyRoles.${index}.roleName"]`
                      ) as HTMLInputElement;
                      if (input) input.value = selectedRole.name;
                    }
                  }}
                >
                  {companyRoleTypes.map((rt) => (
                    <option key={rt._id} value={rt._id}>
                      {rt.name}
                    </option>
                  ))}
                </Select>
                <input
                  type="hidden"
                  {...register(`companyRoles.${index}.roleName` as const)}
                  defaultValue={field.roleName}
                />
              </FormControl>

              {/* Role Badge (visual indicator) */}
              {field.roleName && (
                <Badge colorScheme="purple" alignSelf="center">
                  {field.roleName}
                </Badge>
              )}

              {/* Remove Button */}
              <IconButton
                aria-label="Remove company"
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

export default CompanyRolesSection;
