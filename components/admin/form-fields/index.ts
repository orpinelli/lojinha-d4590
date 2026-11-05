import {
	ChoiceField,
	ColorField,
	MoneyField,
	NumberField,
	SelectField,
	SwitchField,
	TextField,
	TextareaField,
} from "./basic-fields";
import {
	ChipsField,
	ImageField,
	ImageListField,
	SizesField,
	StringListField,
} from "./collection-fields";

/**
 * Form fields bound to the surrounding react-hook-form context by `name`.
 * `<Field.Text name="name" label="Nome" />`
 */
export const Field = {
	Text: TextField,
	Textarea: TextareaField,
	Number: NumberField,
	Money: MoneyField,
	Select: SelectField,
	Switch: SwitchField,
	Color: ColorField,
	Choice: ChoiceField,
	Chips: ChipsField,
	Image: ImageField,
	ImageList: ImageListField,
	StringList: StringListField,
	Sizes: SizesField,
};
