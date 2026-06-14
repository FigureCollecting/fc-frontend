/**
 * CompanyRolesSection Component
 *
 * Manages company roles array in the figure form.
 * Allows adding/removing companies with role type selection.
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
          size="sm"
          variant="outline"
          colorPalette="blue"
          onClick={handleAddCompany}
          aria-label="Add company"><FaPlus />Add Company
                  </Button>
      </HStack>
      {fields.length === 0 ? (
        <Text color="gray.500" fontSize="sm" fontStyle="italic">
          No companies added. Click &quot;Add Company&quot; to assign company roles.
        </Text>
      ) : (
        <VStack gap={3} align="stretch">
          {fields.map((field, index) => (
            <HStack key={field.id} gap={3} p={3} borderWidth="1px" borderRadius="md" bg={rowBgColor}>
              {/* Company Name Input */}
              <Field.Root flex="2">
                <Input
                  {...register(`companyRoles.${index}.companyName` as const)}
                  placeholder="Company name"
                  defaultValue={field.companyName}
                />
              </Field.Root>

              {/* Role Type Select */}
              <Field.Root flex="1">
                <NativeSelect.Root>
                  <NativeSelect.Field
                    {...register(`companyRoles.${index}.roleId` as const, {
                      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                        const selectedRole = companyRoleTypes.find((rt) => rt._id === e.target.value);
                        if (selectedRole) {
                          // Update roleName when roleId changes
                          const input = document.querySelector(
                            `input[name="companyRoles.${index}.roleName"]`
                          ) as HTMLInputElement;
                          if (input) input.value = selectedRole.name;
                        }
                      },
                    })}
                    aria-label="Role"
                    defaultValue={
                      // Use roleId if set, otherwise find by roleName (handles race condition)
                      field.roleId ||
                      companyRoleTypes.find(rt => rt.name.toLowerCase() === field.roleName?.toLowerCase())?._id ||
                      ''
                    }>
                    {companyRoleTypes.map((rt) => (
                      <option key={rt._id} value={rt._id}>
                        {rt.name}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
                <input
                  type="hidden"
                  {...register(`companyRoles.${index}.roleName` as const)}
                  defaultValue={field.roleName}
                />
              </Field.Root>

              {/* Role Badge (visual indicator) */}
              {field.roleName && (
                <Badge colorPalette="purple" alignSelf="center">
                  {field.roleName}
                </Badge>
              )}

              {/* Remove Button */}
              <IconButton
                aria-label="Remove company"
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

export default CompanyRolesSection;
