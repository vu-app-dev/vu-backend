import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RegisterUserInput } from '../../auth/inputs/register-manager.input';

export class EditUserInput extends PartialType(
  OmitType(RegisterUserInput, [
    'email',
    'password',
    'confirmPassword',
  ] as const),
) {
  @ApiPropertyOptional({ example: 'Aya', description: 'Updated first name' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Hassan', description: 'Updated last name' })
  lastName?: string;

  @ApiPropertyOptional({
    example: '+201001112223',
    description: 'Updated phone number',
  })
  phone?: string;

  @ApiPropertyOptional({
    example: 'HR Specialist',
    description: 'Updated job title',
  })
  jobTitle?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/profiles/aya-new.jpg',
    description: 'Updated profile image URL',
  })
  profilePictureUrl?: string;
}
