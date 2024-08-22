"use client";
import { useOpenWidget } from "@/features/widgets/hooks/use-open-widget";
import { CategoryType, LabelValueType, WidgetType } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UpdatedWidget,
  useDashboardStore,
  WidgetUpdateWithCategory,
} from "@/features/summery/hooks/use-dashboard-store";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2 } from "lucide-react";
import Actions from "./actions";
import { showToast } from "@/lib/toast";

type Updated = {
  selected: boolean;
  categoryId: string;
  widgetId: string;
};

const FormSchema = z.object({
  items: z.array(
    z.object({
      widgetId: z.string(),
      categoryId: z.string(),
      selected: z.boolean(),
    })
  ),
});

const convertToWidgetUpdateWithCategory = (
  updatedWidgets: Updated[]
): WidgetUpdateWithCategory[] => {
  // Create a map to group updates by categoryId
  const categoryMap: Record<string, UpdatedWidget[]> = {};

  updatedWidgets.forEach((widget) => {
    // Prepare the updated widget
    const updatedWidget: UpdatedWidget = {
      widgetId: widget.widgetId,
      updatedWidget: {
        selected: widget.selected,
      },
    };

    // Group by categoryId
    if (!categoryMap[widget.categoryId]) {
      categoryMap[widget.categoryId] = [];
    }

    categoryMap[widget.categoryId].push(updatedWidget);
  });

  // Convert the map to WidgetUpdateWithCategory[]
  return Object.keys(categoryMap).map((categoryId) => ({
    categoryId,
    updates: categoryMap[categoryId],
  }));
};

type WidgetFormType = {
  categoryOptions: LabelValueType[];
};

const Widgets = ({ categoryOptions }: WidgetFormType) => {
  const { categoryId, onClose } = useOpenWidget();
  const { getAllWidgets, updateWidgets, deleteWidget } = useDashboardStore();
  const allWidgets = getAllWidgets();

  const defaultWidgets: z.infer<typeof FormSchema> = {
    items: allWidgets.map((item) => ({
      widgetId: item.widgetId,
      categoryId: item.categoryId,
      selected: item.selected,
    })),
  };

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: defaultWidgets,
  });

  const handleAddWidget = (data: z.infer<typeof FormSchema>) => {
    // Filter out non-updated widgets
    const updatedWidgets: Updated[] = data.items.filter((widget) => {
      const originalWidget = defaultWidgets.items.find(
        (item) => item.widgetId === widget.widgetId
      );

      // Check if the widget has been updated
      return originalWidget && originalWidget.selected !== widget.selected;
    });

    const value = convertToWidgetUpdateWithCategory(updatedWidgets);

    updateWidgets(value);
    showToast.success("widget updated");
    onClose();
  };

  const handleDeleteWidget = (categoryId: string, widgetId: string) => {
    console.log("handleDeleteWidget", { widgetId, categoryId });

    deleteWidget(categoryId, widgetId);

    onClose();

    showToast.success("widget deleted");
  };

  return (
    <div className="h-full w-full ">
      <div className="flex flex-col">
        <Tabs defaultValue={categoryId} className="flex-col w-full">
          <TabsList className="flex justify-start">
            {categoryOptions.map((category) => (
              <TabsTrigger
                className="text-xs md:text-sm"
                key={category.value}
                value={category.value}
              >
                {category.value}
              </TabsTrigger>
            ))}
          </TabsList>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddWidget)}
              className="flex flex-col h-full"
            >
              <div style={{ height: "65vh" }} className="">
                <FormField
                  control={form.control}
                  name="items"
                  render={() => (
                    <FormItem style={{ flex: 1 }} className="flex-grow">
                      {/* Allow form item to grow */}
                      {allWidgets.map((widget) => (
                        <FormField
                          key={widget.widgetId}
                          control={form.control}
                          name="items"
                          render={({ field }) => {
                            const isSelected = field.value.some(
                              (w) =>
                                w.widgetId === widget.widgetId && w.selected
                            );

                            return (
                              <TabsContent
                                className="w-full"
                                key={widget.widgetId}
                                value={widget.categoryId}
                              >
                                <FormItem
                                  style={{ paddingRight: 10 }}
                                  className="w-full flex flex-row items-start space-x-3 space-y-0 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground py-2 px-2"
                                >
                                  <div className="w-full gap-3 flex flex-row items-start">
                                    <FormControl>
                                      <Checkbox
                                        style={{ marginLeft: 10 }}
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          console.log("checked  --> ", checked);

                                          const updatedItems = field.value.map(
                                            (w) =>
                                              w.widgetId === widget.widgetId
                                                ? {
                                                    ...w,
                                                    selected: checked,
                                                  }
                                                : w
                                          );

                                          field.onChange(updatedItems);
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-xs font-normal hover:cursor-pointer">
                                      {widget.widgetName}
                                    </FormLabel>
                                  </div>
                                  <Actions
                                    onConfirm={() =>
                                      handleDeleteWidget(
                                        widget.categoryId,
                                        widget.widgetId
                                      )
                                    }
                                  />
                                </FormItem>
                              </TabsContent>
                            );
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Submit button container */}
              <div
                style={{
                  marginTop: 20,
                  height: 40,
                  display: "flex",
                  justifyContent: "end",
                }}
              >
                <Button
                  onClick={() => onClose()}
                  className="mr-2"
                  variant="outline"
                  type="button"
                >
                  Cancel
                </Button>
                <Button className="" type="submit">
                  Submit
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </div>
    </div>
  );
};

export default Widgets;